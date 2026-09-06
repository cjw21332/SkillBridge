import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import { getSocket } from "../../lib/socket";
import { useNavigate } from "react-router-dom";
import { Bell, Check, MessageSquare, Calendar, Users, Star, CheckCheck } from "lucide-react";

export const NotificationBell: React.FC = () => {
  const { accessToken } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const { data: notifData } = useQuery(
    "notifications",
    () => api.get("/notifications?limit=15").then((res) => res.data),
    { enabled: !!accessToken }
  );

  const markAsReadMutation = useMutation((id: string) => api.patch(`/notifications/${id}/read`), {
    onSuccess: () => queryClient.invalidateQueries("notifications"),
  });

  const markAllAsReadMutation = useMutation(() => api.patch("/notifications/read-all"), {
    onSuccess: () => queryClient.invalidateQueries("notifications"),
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotif = () => {
      queryClient.invalidateQueries("notifications");
    };

    socket.on("notification:new", handleNewNotif);
    return () => {
      socket.off("notification:new", handleNewNotif);
    };
  }, [queryClient]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!accessToken) return null;

  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;

  const handleNotificationClick = (notif: any) => {
    if (!notif.readAt) {
      markAsReadMutation.mutate(notif.id);
    }
    setIsOpen(false);

    // Route depending on type
    if (notif.type === "NEW_MESSAGE") {
      navigate(`/chat?matchId=${notif.payload?.matchId || ""}`);
    } else if (notif.type === "BOOKING_UPDATE") {
      navigate("/bookings");
    } else if (notif.type === "NEW_MATCH") {
      navigate("/matches");
    } else if (notif.type === "NEW_REVIEW") {
      navigate("/profile");
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "NEW_MESSAGE":
        return <MessageSquare className="w-4 h-4 text-[var(--color-primary)]" />;
      case "BOOKING_UPDATE":
        return <Calendar className="w-4 h-4 text-[var(--color-warning)]" />;
      case "NEW_MATCH":
        return <Users className="w-4 h-4 text-[var(--color-success)]" />;
      case "NEW_REVIEW":
        return <Star className="w-4 h-4 text-amber-500 fill-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const getNotifText = (notif: any) => {
    const p = notif.payload || {};
    switch (notif.type) {
      case "NEW_MESSAGE":
        return `${p.senderName || "Someone"} sent a message: "${p.preview || ""}"`;
      case "BOOKING_UPDATE":
        return `Booking status updated to ${p.status || "Updated"}`;
      case "NEW_MATCH":
        return p.status === "ACCEPTED"
          ? `${p.accepterName || "A user"} accepted your match request!`
          : `${p.requesterName || "A user"} sent you a match request!`;
      case "NEW_REVIEW":
        return `${p.authorName || "A partner"} left you a ${p.rating}★ review!`;
      default:
        return "You have a new update.";
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-[var(--color-accent)] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute -right-2 md:right-auto md:-left-2 mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-96 bg-white rounded-2xl shadow-xl border border-[var(--color-border)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3.5 border-b border-[var(--color-border)] bg-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm font-heading">Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-[11px] bg-blue-100 text-[var(--color-primary)] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isLoading}
                className="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1 transition-colors"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--color-text-secondary)]">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n: any) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full p-3.5 flex items-start gap-3 text-left transition-colors hover:bg-slate-50 ${
                    !n.readAt ? "bg-blue-50/40" : ""
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0 mt-0.5 shadow-2xs">
                    {getNotifIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${!n.readAt ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                      {getNotifText(n)}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {!n.readAt && (
                    <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
