import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { Calendar as CalendarIcon, Clock, User, CheckCircle, Plus, LayoutGrid, CalendarDays, X } from "lucide-react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ReviewModal } from "../components/reviews/ReviewModal";
import { getSocket } from "../lib/socket";

const localizer = momentLocalizer(moment);

const getMyUserId = (token: string | null) => {
  if (!token) return "";
  try { return JSON.parse(atob(token.split(".")[1])).userId; } catch { return ""; }
};

export const BookingsPage: React.FC = () => {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const myUserId = getMyUserId(accessToken);

  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedReviewBooking, setSelectedReviewBooking] = useState<{ id: string; partnerName: string } | null>(null);

  const { data: bookingsData, isLoading } = useQuery(
    "bookings",
    () => api.get("/bookings").then((res) => res.data),
    { enabled: !!accessToken }
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onBookingUpdate = () => queryClient.invalidateQueries("bookings");
    socket.on("booking:update", onBookingUpdate);
    return () => { socket.off("booking:update", onBookingUpdate); };
  }, [queryClient]);

  const cancelMutation = useMutation((id: string) => api.patch(`/bookings/${id}`, { status: "CANCELLED" }), {
    onSuccess: () => queryClient.invalidateQueries("bookings")
  });

  const confirmMutation = useMutation((id: string) => api.patch(`/bookings/${id}`, { status: "CONFIRMED" }), {
    onSuccess: () => queryClient.invalidateQueries("bookings")
  });

  const declineMutation = useMutation((id: string) => api.patch(`/bookings/${id}`, { status: "DECLINED" }), {
    onSuccess: () => queryClient.invalidateQueries("bookings")
  });

  if (!accessToken) {
    return <div className="text-center py-12 text-[var(--color-text-secondary)] font-medium">Please login to view bookings.</div>;
  }

  const bookingList = Array.isArray(bookingsData) ? bookingsData : bookingsData?.data || [];
  const confirmedBookings = bookingList.filter((b: any) => b.status === "CONFIRMED");

  const events = confirmedBookings.map((b: any) => {
    const start = new Date(b.scheduledAt);
    const end = new Date(start.getTime() + (b.durationMin || 60) * 60000);
    const isHost = b.hostId === myUserId;
    const partner = isHost ? b.guest : b.host;
    
    return {
      id: b.id,
      title: `${b.skill?.name || "Skill Session"} with ${partner?.name || "Partner"}`,
      start,
      end,
      resource: b
    };
  });

  const handleCancel = (id: string, scheduledAt: string) => {
    const scheduledDate = new Date(scheduledAt);
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    if (scheduledDate < oneHourFromNow) {
      alert("Cannot cancel a booking within 1 hour of the scheduled time.");
      return;
    }
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      cancelMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Session Bookings</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Manage your skill exchange learning sessions.</p>
        </div>
        <div className="bg-slate-100 p-1 rounded-xl inline-flex w-max self-start sm:self-auto">
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${viewMode === "calendar" ? "bg-white text-[var(--color-primary)] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <CalendarDays className="w-4 h-4" /> Calendar
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${viewMode === "list" ? "bg-white text-[var(--color-primary)] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <LayoutGrid className="w-4 h-4" /> List
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">Loading bookings...</div>
      ) : bookingList.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-[var(--color-border)] text-center shadow-xs">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-1">No Booked Sessions Yet</h3>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-md mx-auto">
            Once you connect with a partner, propose sessions in chat to see them here on your calendar.
          </p>
        </div>
      ) : viewMode === "calendar" ? (
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-xs h-[600px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView={Views.WEEK}
            views={['month', 'week', 'day', 'agenda']}
            step={30}
            showMultiDayTimes
            className="font-sans text-sm pb-4"
            eventPropGetter={(event: any) => {
              const isPast = new Date() > event.start;
              return {
                style: {
                  backgroundColor: isPast ? "var(--color-text-secondary)" : "var(--color-primary)",
                  borderRadius: "6px",
                  border: "none",
                  padding: "4px 8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  opacity: isPast ? 0.7 : 1
                }
              };
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">All Sessions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookingList.map((b: any) => {
              const isHost = b.hostId === myUserId;
              const partner = isHost ? b.guest : b.host;
              const isRecipient = b.proposedById ? b.proposedById !== myUserId : b.hostId !== myUserId;
              
              let statusColor = "bg-blue-50 text-[var(--color-primary)] border-blue-100";
              if (b.status === "COMPLETED") statusColor = "bg-green-50 text-[var(--color-success)] border-green-200";
              if (b.status === "DECLINED" || b.status === "CANCELLED") statusColor = "bg-red-50 text-[var(--color-error)] border-red-100";
              if (b.status === "PROPOSED") statusColor = "bg-amber-50 text-amber-600 border-amber-200";

              return (
                <div key={b.id} className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2.5 py-0.5 border text-[11px] font-bold rounded-full ${statusColor}`}>
                        {b.status === "PROPOSED" 
                          ? (isRecipient ? "PROPOSED TO YOU" : "PROPOSED BY YOU") 
                          : b.status}
                      </span>
                      {b.status === "PROPOSED" && isRecipient && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => confirmMutation.mutate(b.id)}
                            className="px-2.5 py-1 bg-[var(--color-success)] hover:opacity-90 text-white rounded-lg text-xs font-bold transition-opacity"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => declineMutation.mutate(b.id)}
                            className="px-2.5 py-1 bg-[var(--color-error)] hover:opacity-90 text-white rounded-lg text-xs font-bold transition-opacity"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {b.status === "PROPOSED" && !isRecipient && (
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Awaiting partner
                        </span>
                      )}
                      {b.status === "COMPLETED" && (
                        <button
                          onClick={() => setSelectedReviewBooking({ id: b.id, partnerName: partner?.name || "Partner" })}
                          className="text-xs font-semibold text-[var(--color-primary)] hover:bg-blue-50 border border-[var(--color-primary)] px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Leave Review
                        </button>
                      )}
                      {b.status === "CONFIRMED" && (
                        <button onClick={() => handleCancel(b.id, b.scheduledAt)} className="p-1 hover:bg-red-50 text-[var(--color-error)] rounded transition-colors" title="Cancel Booking">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <h4 className="font-bold text-base mb-1">{b.skill?.name || "Skill Session"} <span className="text-[var(--color-text-secondary)] font-normal text-sm block md:inline mt-0.5 md:mt-0 md:ml-1">— {isHost ? "Teaching" : "Learning"}</span></h4>
                    <div className="flex items-center gap-2 mt-3 text-sm font-semibold">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-[var(--color-text-primary)] flex items-center justify-center text-xs">
                        {partner?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <span>{partner?.name || "Partner"}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-[13px] text-[var(--color-text-secondary)] font-medium">
                    <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4 text-[var(--color-primary)]" /> {new Date(b.scheduledAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[var(--color-primary)]" /> {new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({b.durationMin}m)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {selectedReviewBooking && (
        <ReviewModal
          isOpen={!!selectedReviewBooking}
          onClose={() => setSelectedReviewBooking(null)}
          bookingId={selectedReviewBooking.id}
          partnerName={selectedReviewBooking.partnerName}
          onReviewSubmitted={() => queryClient.invalidateQueries("bookings")}
        />
      )}
    </div>
  );
};