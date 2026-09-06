import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import { X, Calendar, Clock, BookOpen, Check } from "lucide-react";

interface ProposeSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  partnerName: string;
  partnerId: string;
  onBookingProposed: (booking: any) => void;
}

export const ProposeSessionModal: React.FC<ProposeSessionModalProps> = ({
  isOpen,
  onClose,
  matchId,
  partnerName,
  onBookingProposed,
}) => {
  const { accessToken } = useAuthStore();
  const [skills, setSkills] = useState<any[]>([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken) return;

    // Fetch my profile to get skills I teach
    api.get("/users/me").then((res) => {
      const myTeachSkills = (res.data.teachSkills || []).map((s: any) => ({
        ...s.skill,
        isMine: true,
      }));
      setSkills(myTeachSkills);
    });
  }, [accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      const res = await api.post("/bookings", {
        matchId,
        skillId: selectedSkill,
        scheduledAt,
        durationMin: duration,
      });

      onBookingProposed(res.data);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to propose session"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h3 className="font-bold text-lg font-heading">Propose a Session</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-sm text-[var(--color-error)] bg-red-50 rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="text-sm text-[var(--color-text-secondary)] mb-2">
            Skill exchange with <span className="font-semibold text-[var(--color-text-primary)]">{partnerName}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
              <BookOpen className="w-3.5 h-3.5 inline mr-1" />
              Skill to teach (from your profile)
            </label>
            <select
              required
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)] shadow-2xs"
            >
              <option value="">Select a skill you teach...</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)] shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                Time
              </label>
              <input
                type="time"
                required
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)] shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
              Duration (minutes)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)] shadow-2xs"
            >
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
              <option value={120}>120 min</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedSkill || !scheduledDate || !scheduledTime}
            className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-xl font-semibold text-sm transition-all shadow-xs disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? "Sending..." : <><Check className="w-4 h-4" /> Propose Session</>}
          </button>
        </form>
      </div>
    </div>
  );
};