import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { getSocket } from "../lib/socket";
import { MessageSquare, Send, ArrowLeft, Calendar, Check } from "lucide-react";
import { ProposeSessionModal } from "../components/booking/ProposeSessionModal";

const getMyUserId = (token: string | null) => {
  if (!token) return "";
  try { return JSON.parse(atob(token.split(".")[1])).userId; } catch { return ""; }
};

export const ChatPage: React.FC = () => {
  const { accessToken } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const urlMatchId = new URLSearchParams(location.search).get("matchId");
  const myUserId = getMyUserId(accessToken);

  const [activeMatchId, setActiveMatchId] = useState<string | null>(urlMatchId);
  const [messageText, setMessageText] = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proposedBookings, setProposedBookings] = useState<any[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [partnerPresence, setPartnerPresence] = useState<{ online: boolean; lastSeenAt: string | null }>({ online: false, lastSeenAt: null });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const { data: matchesData } = useQuery(
    "matches",
    () => api.get("/matches").then((r) => r.data),
    { enabled: !!accessToken }
  );

  const matchList = Array.isArray(matchesData) ? matchesData : matchesData?.data || [];
  const acceptedMatches = matchList.filter((m: any) => m.status === "ACCEPTED");

  useEffect(() => {
    if (urlMatchId) setActiveMatchId(urlMatchId);
    else if (!activeMatchId && acceptedMatches.length > 0) setActiveMatchId(acceptedMatches[0].id);
  }, [urlMatchId, acceptedMatches.length]);

  const activeMatch = acceptedMatches.find((m: any) => m.id === activeMatchId);
  const activePartner = activeMatch
    ? activeMatch.requestedBy?.id === myUserId
      ? activeMatch.requestedTo
      : activeMatch.requestedBy
    : null;

  const { data: historyData } = useQuery(
    ["messages", activeMatchId],
    () => api.get(`/matches/${activeMatchId}/messages?limit=50`).then((r) => r.data),
    { enabled: !!activeMatchId }
  );

  useEffect(() => {
    if (historyData?.messages) {
      setLocalMessages([...historyData.messages].reverse());
      if (activeMatchId) {
        api.patch(`/matches/${activeMatchId}/messages/read`).catch(() => {});
        setUnreadCounts((p) => ({ ...p, [activeMatchId]: 0 }));
      }
    }
  }, [historyData, activeMatchId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeMatchId) return;

    socket.emit("match:join", { matchId: activeMatchId });

    // Send initial presence heartbeat; start periodic pings
    socket.emit("presence:ping");
    const interval = setInterval(() => socket.emit("presence:ping"), 15000);

    return () => {
      socket.emit("match:leave", { matchId: activeMatchId });
      clearInterval(interval);
    };
  }, [activeMatchId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewMessage = (msg: any) => {
      if (msg.matchId === activeMatchId) {
        setLocalMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        api.patch(`/matches/${activeMatchId}/messages/read`).catch(() => {});
      } else {
        setUnreadCounts((p) => ({ ...p, [msg.matchId]: (p[msg.matchId] || 0) + 1 }));
      }
      queryClient.invalidateQueries("matches");
    };

    const onTyping = (data: { matchId: string; isTyping: boolean }) => {
      if (data.matchId === activeMatchId) setIsOtherTyping(data.isTyping);
    };

    const onBookingUpdate = (booking: any) => {
      setProposedBookings((prev) =>
        prev.some((b) => b.id === booking.id)
          ? prev.map((b) => (b.id === booking.id ? booking : b))
          : [...prev, booking]
      );
      queryClient.invalidateQueries("bookings");
    };

    const onMessageRead = (data: { matchId: string; readBy: string; readAt: string }) => {
      if (data.matchId === activeMatchId) {
        setLocalMessages((prev) =>
          prev.map((m) =>
            m.senderId !== data.readBy && !m.readAt
              ? { ...m, readAt: data.readAt }
              : m
          )
        );
      }
    };

    const onProfileUpdated = (data: { userId: string; avatarUrl?: string; name?: string }) => {
      queryClient.invalidateQueries("matches");
      queryClient.invalidateQueries("profile");
      setLocalMessages((prev) =>
        prev.map((m) =>
          m.senderId === data.userId
            ? {
                ...m,
                sender: {
                  ...m.sender,
                  avatarUrl: data.avatarUrl,
                  name: data.name || m.sender?.name,
                },
              }
            : m
        )
      );
    };

    const onPresenceUpdate = (data: { userId: string; lastSeenAt: string }) => {
      if (data.userId === activePartner?.id) {
        const now = Date.now();
        const seenMs = new Date(data.lastSeenAt).getTime();
        setPartnerPresence({
          online: (now - seenMs) < 60000,
          lastSeenAt: data.lastSeenAt,
        });
      }
    };

    const onMessageNew = () => {
      queryClient.invalidateQueries(["messages", activeMatchId]);
      queryClient.invalidateQueries("matches");
    };

    socket.on("message:new", onNewMessage);
    socket.on("message:read", onMessageRead);
    socket.on("typing:update", onTyping);
    socket.on("booking:update", onBookingUpdate);
    socket.on("user:profile_updated", onProfileUpdated);
    socket.on("presence:update", onPresenceUpdate);
    socket.on("message:new", onMessageNew);

    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("message:read", onMessageRead);
      socket.off("typing:update", onTyping);
      socket.off("booking:update", onBookingUpdate);
      socket.off("user:profile_updated", onProfileUpdated);
      socket.off("presence:update", onPresenceUpdate);
      socket.off("message:new", onMessageNew);
    };
  }, [activeMatchId, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, isOtherTyping]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    const socket = getSocket();
    if (!socket || !activeMatchId) return;
    socket.emit("typing:start", { matchId: activeMatchId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket.emit("typing:stop", { matchId: activeMatchId }), 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeMatchId) return;
    const content = messageText.trim();
    setMessageText("");
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("typing:stop", { matchId: activeMatchId });
      socket.emit("message:send", { matchId: activeMatchId, content }, (res: any) => {
        if (res?.error) api.post(`/matches/${activeMatchId}/messages`, { content }).catch(() => {});
      });
    } else {
      await api.post(`/matches/${activeMatchId}/messages`, { content }).catch(() => {});
    }
  };

  const handleBookingAction = async (bookingId: string, status: "CONFIRMED" | "DECLINED") => {
    try {
      const res = await api.patch(`/bookings/${bookingId}`, { status });
      setProposedBookings((prev) => prev.map((b) => (b.id === bookingId ? res.data : b)));
      queryClient.invalidateQueries("bookings");
    } catch (err: any) {
      console.error("Booking action failed", err.response?.data?.error?.message);
    }
  };

  const matchBookings = proposedBookings.filter((b) => b.matchId === activeMatchId);

  if (!accessToken) return (
    <div className="text-center py-12 text-[var(--color-text-secondary)] font-medium">Please login to access chat.</div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Messages</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Real-time chat with your skill exchange partners.</p>
      </div>

      {acceptedMatches.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-[var(--color-border)] text-center shadow-xs">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-1">No Active Conversations</h3>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto">
            Accept a match request first to unlock messaging.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[var(--color-border)] shadow-xs grid grid-cols-1 md:grid-cols-3 h-[640px] overflow-hidden">
          {/* Conversation List */}
          <div className={`border-r border-[var(--color-border)] flex flex-col ${activeMatchId ? "hidden md:flex" : "flex"}`}>
            <div className="p-4 border-b border-[var(--color-border)] bg-slate-50/60">
              <h3 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Conversations ({acceptedMatches.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {acceptedMatches.map((m: any) => {
                const partner = m.requestedBy?.id === myUserId ? m.requestedTo : m.requestedBy;
                const isSelected = activeMatchId === m.id;
                const unread = unreadCounts[m.id] || 0;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setActiveMatchId(m.id); navigate(`/chat?matchId=${m.id}`); }}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left ${isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50"}`}
                  >
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden">
                        {partner?.avatarUrl ? (
                          <img src={partner.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          partner?.name?.charAt(0)?.toUpperCase() || "U"
                        )}
                      </div>
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-accent)] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{partner?.name || "Partner"}</h4>
                      <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
                        {m.messages?.[0]?.content || "Tap to chat..."}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Thread */}
          <div className={`md:col-span-2 flex flex-col min-h-0 bg-slate-50/40 ${!activeMatchId ? "hidden md:flex" : "flex"}`}>
            {activeMatch ? (
              <>
                {/* Chat Header */}
                <div className="shrink-0 relative z-10 p-3 px-4 bg-white dark:bg-[#151D2F] border-b border-[var(--color-border)] flex justify-between items-center shadow-sm"
                  style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setActiveMatchId(null)} className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <Link
                      to={`/profile/${activePartner?.id}`}
                      className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm shadow-2xs hover:opacity-90 overflow-hidden shrink-0"
                    >
                      {activePartner?.avatarUrl ? (
                        <img src={activePartner.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        activePartner?.name?.charAt(0)?.toUpperCase() || "U"
                      )}
                    </Link>
                    <div>
                      <Link
                        to={`/profile/${activePartner?.id}`}
                        className="font-bold text-sm leading-tight hover:underline hover:text-[var(--color-primary)] transition-colors block"
                      >
                        {activePartner?.name || "Partner"}
                      </Link>
                      <span className={`text-[11px] font-medium ${partnerPresence.online ? "text-emerald-500" : partnerPresence.lastSeenAt ? "text-amber-500" : "text-slate-400"}`}>
                    {partnerPresence.online ? ("● Online") : partnerPresence.lastSeenAt ? (`● Active ${Math.max(1, Math.round((Date.now() - new Date(partnerPresence.lastSeenAt).getTime()) / 60000))}m ago`) : ("● Offline")}
                  </span>
                    </div>
                  </div>
                  {/* PHASE 6: Propose Session — now active */}
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Propose Session</span>
                  </button>
                </div>

                {/* Pending booking cards inline in thread */}
                {matchBookings.filter((b) => b.status === "PROPOSED").map((booking) => {
                  const isRecipient = booking.proposedById 
                    ? booking.proposedById !== myUserId 
                    : booking.hostId !== myUserId;

                  return (
                    <div key={booking.id} className="mx-4 mt-3 p-3.5 rounded-xl border-2 border-[var(--color-warning)] dark:border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 flex items-center justify-between gap-3 shrink-0 shadow-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Calendar className="w-4 h-4 text-[var(--color-warning)] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                            {isRecipient ? "Session Proposed to You" : "You Proposed a Session"}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-secondary)]">
                            {new Date(booking.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} · {booking.durationMin} min
                          </p>
                        </div>
                      </div>
                      {isRecipient ? (
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => handleBookingAction(booking.id, "CONFIRMED")}
                            className="px-3 py-1.5 bg-[var(--color-success)] hover:opacity-90 text-white text-xs font-bold rounded-lg transition-all shadow-2xs"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleBookingAction(booking.id, "DECLINED")}
                            className="px-3 py-1.5 bg-[var(--color-error)] hover:opacity-90 text-white text-xs font-bold rounded-lg transition-all shadow-2xs"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-amber-800 bg-amber-200/60 px-2.5 py-1 rounded-lg shrink-0">
                          Awaiting partner's response
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Messages Body */}
                <div className="relative min-h-0 flex-1 overflow-y-auto p-4 pt-6 space-y-4 bg-[#f0f2f5] dark:bg-[#0B0F19]">
                  {localMessages.length === 0 ? (
                    <div className="text-center py-16 text-xs text-[var(--color-text-secondary)]">
                      No messages yet. Say hello to start your exchange!
                    </div>
                  ) : (
                    localMessages.map((msg: any, index: number) => {
                      const isMe = msg.senderId === myUserId;
                      // Only the newest message of a sender's consecutive group gets the avatar
                      const nextMsg = localMessages[index + 1];
                      const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
                      // Only the actual newest message sent by me shows read/delivered state
                      const isLastMyMessage = (() => {
                        for (let i = localMessages.length - 1; i >= 0; i--) {
                          if (localMessages[i].senderId === myUserId) return localMessages[i].id === msg.id;
                        }
                        return false;
                      })();

                      return (
                        <div key={msg.id || msg.createdAt} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`flex items-end gap-1.5 max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                            {/* Avatar for the other person (Messenger logic) - small, anchored to the bubble */}
                            {!isMe && isLastInGroup && (
                              <Link
                                to={`/profile/${msg.senderId}`}
                                className="w-7 h-7 rounded-full bg-[var(--color-primary)] shrink-0 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden hover:opacity-90 transition-opacity self-end mb-1"
                              >
                                {msg.sender?.avatarUrl ? (
                                  <img src={msg.sender.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  msg.sender?.name?.charAt(0)?.toUpperCase() || "U"
                                )}
                              </Link>
                            )}
                            
                            <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} group/msg relative`}>
                              <div
                                onClick={() => setSelectedMessageId(prev => prev === msg.id ? null : msg.id)}
                                className={`px-4 py-2.5 text-[15px] leading-relaxed shadow-sm cursor-pointer select-none transition-all active:scale-[0.99] ${
                                  isMe
                                    ? "bg-[#0084ff] text-white rounded-2xl rounded-br-sm hover:brightness-105"
                                    : "bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-2xl rounded-bl-sm hover:bg-slate-50 dark:hover:bg-slate-750"
                                }`}
                                title="Click to view delivery details"
                              >
                                {msg.content}
                              </div>
                              
                              {/* Metadata / Time / Seen Indicator */}
                              <div className="flex items-center gap-1.5 mt-1 px-1 text-[11px] text-gray-400">
                                {/* Time sent */}
                                <span className={`transition-opacity ${selectedMessageId === msg.id ? "opacity-100 font-medium text-gray-600" : "opacity-75 group-hover/msg:opacity-100"}`}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>

                                {/* Clicked / Expanded Detailed Seen Timestamp */}
                                {isMe && msg.readAt && selectedMessageId === msg.id && (
                                  <span className="text-[10px] text-blue-600 font-semibold animate-in fade-in duration-150">
                                    · Seen at {new Date(msg.readAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}

                                {/* Messenger-style Seen Avatar or Delivered checkmark for last message */}
                                {isMe && isLastMyMessage && (
                                  <div className="relative group/seen flex items-center ml-1">
                                    {msg.readAt ? (
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedMessageId(prev => prev === msg.id ? null : msg.id);
                                        }}
                                        className="relative flex items-center cursor-pointer"
                                      >
                                        {/* Tiny Partner Avatar for Seen */}
                                        <div
                                          className="w-4 h-4 rounded-full bg-[var(--color-primary)] text-white text-[9px] font-bold flex items-center justify-center overflow-hidden border-2 border-white shadow-xs hover:scale-125 transition-transform"
                                        >
                                          {activePartner?.avatarUrl ? (
                                            <img src={activePartner.avatarUrl} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                            activePartner?.name?.charAt(0)?.toUpperCase() || "U"
                                          )}
                                        </div>

                                        {/* Tooltip on hovering or dragging cursor over the Seen avatar */}
                                        <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/seen:flex items-center bg-slate-900/90 text-white text-[10px] font-medium py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                                          Seen by {activePartner?.name?.split(" ")[0] || "Partner"} at{" "}
                                          {new Date(msg.readAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5" title="Delivered">
                                        <Check className="w-3 h-3 text-slate-400" /> Delivered
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                        </div>
                      </div>
                      );
                    })
                  )}
                  {isOtherTyping && (
                        <div className="flex w-full justify-start items-end gap-2.5">
                           <Link
                             to={`/profile/${activePartner?.id}`}
                             className="w-8 h-8 rounded-full bg-[var(--color-primary)] shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-xs overflow-hidden"
                           >
                             {activePartner?.avatarUrl ? (
                               <img src={activePartner.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                             ) : (
                               activePartner?.name?.charAt(0)?.toUpperCase() || "U"
                             )}
                           </Link>
                           <div className="flex items-center gap-1 p-3 bg-white rounded-2xl rounded-bl-sm border border-gray-200 shadow-sm">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="shrink-0 p-3 bg-white dark:bg-[#151D2F] border-t border-[var(--color-border)] flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={handleTextChange}
                    placeholder="Write a message..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)] shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition-all disabled:opacity-40 shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-secondary)]">
                <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm font-medium">Select a conversation to start chatting.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeMatch && activePartner && (
        <ProposeSessionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          matchId={activeMatch.id}
          partnerName={activePartner.name}
          partnerId={activePartner.id}
          onBookingProposed={(booking) => {
            setProposedBookings((prev) => [...prev, booking]);
            queryClient.invalidateQueries("bookings");
          }}
        />
      )}
    </div>
  );
};
