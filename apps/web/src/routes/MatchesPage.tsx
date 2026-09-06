import React from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { useProfile } from "../hooks/useProfile";
import { Link } from "react-router-dom";
import { Check, X, Users, MessageSquare, Clock } from "lucide-react";

export const MatchesPage: React.FC = () => {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  const { data: matches, isLoading } = useQuery(
    "matches",
    () => api.get("/matches").then((res) => res.data),
    { enabled: !!accessToken }
  );

  const updateMatchMutation = useMutation(
    ({ id, status }: { id: string; status: "ACCEPTED" | "DECLINED" }) =>
      api.patch(`/matches/${id}`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("matches");
      },
    }
  );

  if (!accessToken) {
    return <div className="text-center py-12 text-[var(--color-text-secondary)]">Please login to view matches.</div>;
  }

  if (isLoading) {
    return <div className="text-center py-12 text-[var(--color-text-secondary)]">Loading matches...</div>;
  }

  const matchList = Array.isArray(matches) ? matches : matches?.data || [];
  
  // Received matches that are pending (require your action)
  const pendingRequests = matchList.filter(
    (m: any) => m.status === "PENDING" && m.requestedToId === profile?.id
  );
  
  // Matches you sent that are still pending
  const sentRequests = matchList.filter(
    (m: any) => m.status === "PENDING" && m.requestedById === profile?.id
  );
  
  const acceptedMatches = matchList.filter((m: any) => m.status === "ACCEPTED");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold font-heading">Your Matches</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Manage your skill exchange connections.</p>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--color-warning)]">Pending Requests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingRequests.map((m: any) => (
              <div key={m.id} className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link
                    to={`/profile/${m.requestedBy?.id}`}
                    className="w-10 h-10 rounded-full bg-amber-100 text-[var(--color-warning)] flex items-center justify-center font-bold hover:opacity-90 overflow-hidden shrink-0"
                  >
                    {m.requestedBy?.avatarUrl ? (
                      <img src={m.requestedBy.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      m.requestedBy?.name?.charAt(0) || "U"
                    )}
                  </Link>
                  <div>
                    <Link
                      to={`/profile/${m.requestedBy?.id}`}
                      className="font-bold text-sm hover:underline hover:text-[var(--color-primary)] transition-colors"
                    >
                      {m.requestedBy?.name || "Partner"}
                    </Link>
                    <p className="text-xs text-[var(--color-text-secondary)]">Requested match · <Link to={`/profile/${m.requestedBy?.id}`} className="underline text-[var(--color-primary)]">View Profile</Link></p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => updateMatchMutation.mutate({ id: m.id, status: "ACCEPTED" })}
                    className="p-2 bg-[var(--color-success)] text-white rounded-lg hover:opacity-90 transition-opacity"
                    title="Accept"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateMatchMutation.mutate({ id: m.id, status: "DECLINED" })}
                    className="p-2 bg-[var(--color-error)] text-white rounded-lg hover:opacity-90 transition-opacity"
                    title="Decline"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--color-text-secondary)]">Sent Requests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sentRequests.map((m: any) => (
              <div key={m.id} className="bg-slate-50 p-5 rounded-2xl border border-[var(--color-border)] shadow-sm flex items-center justify-between opacity-80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold">
                    {m.requestedTo?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{m.requestedTo?.name || "Partner"}</h4>
                    <p className="text-xs text-[var(--color-text-secondary)]">Awaiting response</p>
                  </div>
                </div>
                <div>
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connected Partners */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Connected Partners ({acceptedMatches.length})</h2>
        {acceptedMatches.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-[var(--color-border)] text-center text-xs text-[var(--color-text-secondary)]">
            No accepted matches yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {acceptedMatches.map((m: any) => {
              const partner = m.requestedById === profile?.id ? m.requestedTo : m.requestedBy;
              return (
              <div key={m.id} className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Link
                    to={`/profile/${partner?.id}`}
                    className="w-12 h-12 rounded-full bg-blue-100 text-[var(--color-primary)] flex items-center justify-center font-bold hover:opacity-90 overflow-hidden shrink-0"
                  >
                    {partner?.avatarUrl ? (
                      <img src={partner.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      partner?.name?.charAt(0) || "U"
                    )}
                  </Link>
                  <div>
                    <Link
                      to={`/profile/${partner?.id}`}
                      className="font-bold text-sm hover:underline hover:text-[var(--color-primary)] transition-colors"
                    >
                      {partner?.name || "Partner"}
                    </Link>
                    <span className="block px-2 py-0.5 bg-green-50 text-[var(--color-success)] text-xs font-semibold rounded-full mt-0.5 w-max">
                      Connected
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/profile/${partner?.id}`}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-200 transition-colors"
                  >
                    View Profile
                  </Link>
                  <Link
                    to={`/chat?matchId=${m.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[var(--color-primary)] rounded-lg font-semibold text-xs hover:bg-blue-100 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" /> Chat
                  </Link>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};
