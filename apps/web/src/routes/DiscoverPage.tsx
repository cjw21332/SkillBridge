import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { Sparkles, MapPin, Check, Heart, User } from "lucide-react";
import { Link } from "react-router-dom";
import { SkillBridgeLogo } from "../components/ui/SkillBridgeLogo";

export const DiscoverPage: React.FC = () => {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [requestedIds, setRequestedIds] = useState<string[]>([]);

  const { data: discoverData, isLoading, error } = useQuery(
    "discover",
    () => api.get("/discover").then((res) => res.data),
    { enabled: !!accessToken }
  );

  const requestMatchMutation = useMutation(
    (requestedToId: string) => api.post("/matches", { requestedToId }),
    {
      onSuccess: (_, requestedToId) => {
        setRequestedIds((prev) => [...prev, requestedToId]);
        queryClient.invalidateQueries("matches");
      },
    }
  );

  if (!accessToken) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-[var(--color-border)] text-center max-w-lg mx-auto mt-8 shadow-sm">
        <div className="flex justify-center mb-4">
          <SkillBridgeLogo size="xl" />
        </div>
        <h2 className="text-2xl font-bold font-heading mb-2">Welcome to SkillBridge</h2>
        <p className="text-[var(--color-text-secondary)] text-sm mb-6">
          Teach one, learn one. Connect with partners based on complementary skills.
        </p>
        <Link
          to="/login"
          className="inline-block px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
        >
          Get Started / Sign In
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-12 text-[var(--color-text-secondary)]">Finding skill matches...</div>;
  }

  const candidates = discoverData?.data || discoverData || [];

  return (
    <div className="space-y-10 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white">Discover Partners</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Recommended skill exchange matches based on what you teach and want to learn.
        </p>
      </div>

      {candidates.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-[var(--color-border)] text-center shadow-xs space-y-4">
          <p className="text-[var(--color-text-secondary)] text-sm">No potential matches found yet. Try adding skills to your profile!</p>
          <Link to="/profile" className="inline-block px-5 py-2.5 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-xl shadow-xs hover:opacity-90">
            Update Profile Skills
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {candidates.map((candidate: any) => {
            const isRequested = requestedIds.includes(candidate.id);
            return (
              <div
                key={candidate.id}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-[var(--color-border)] p-7 sm:p-8 shadow-sm flex flex-col justify-between space-y-6 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/profile/${candidate.id}`}
                        className="w-12 h-12 rounded-full bg-blue-100 text-[var(--color-primary)] flex items-center justify-center font-bold text-lg hover:opacity-90 overflow-hidden shrink-0"
                      >
                        {candidate.avatarUrl ? (
                          <img src={candidate.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          candidate.name?.charAt(0)?.toUpperCase() || "U"
                        )}
                      </Link>
                      <div>
                        <Link
                          to={`/profile/${candidate.id}`}
                          className="font-bold text-lg hover:underline hover:text-[var(--color-primary)] transition-colors"
                        >
                          {candidate.name}
                        </Link>
                        {candidate.location && (
                          <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                            <MapPin className="w-3 h-3" />
                            <span>{candidate.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {candidate.matchScore && (
                      <span className="px-3 py-1 bg-green-50 text-[var(--color-success)] text-xs font-bold rounded-full">
                        {Math.round(candidate.matchScore * 100)}% Match
                      </span>
                    )}
                  </div>

                  {candidate.bio && (
                    <p className="text-xs text-[var(--color-text-secondary)] mb-4 line-clamp-2">
                      {candidate.bio}
                    </p>
                  )}

                  <div className="space-y-3 mb-6">
                    <div>
                      <span className="text-xs font-semibold text-[var(--color-primary)] block mb-1">Teaches:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(candidate.teachSkills || []).map((s: any) => (
                          <span key={s.id} className="px-2.5 py-0.5 bg-blue-50 text-[var(--color-primary)] rounded-full text-xs font-medium">
                            {s.skill?.name || "Skill"}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-[var(--color-accent)] block mb-1">Wants to Learn:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(candidate.learnSkills || []).map((s: any) => (
                          <span key={s.id} className="px-2.5 py-0.5 bg-orange-50 text-[var(--color-accent)] rounded-full text-xs font-medium">
                            {s.skill?.name || "Skill"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => requestMatchMutation.mutate(candidate.id)}
                  disabled={isRequested || requestMatchMutation.isLoading}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                    isRequested
                      ? "bg-green-50 text-[var(--color-success)] border border-green-200"
                      : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                  }`}
                >
                  {isRequested ? (
                    <>
                      <Check className="w-4 h-4" /> Request Sent
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4" /> Request Match
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
