import React, { useState } from "react";
import { api } from "../../lib/api";
import { Star, X, Check } from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  partnerName: string;
  onReviewSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  partnerName,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post(`/bookings/${bookingId}/review`, {
        rating,
        comment: comment.trim() || undefined,
      });

      onReviewSubmitted();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to submit review"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h3 className="font-bold text-lg font-heading">Leave a Review</h3>
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

          <div className="text-sm text-[var(--color-text-secondary)] text-center">
            How was your exchange session with <strong className="text-[var(--color-text-primary)]">{partnerName}</strong>?
          </div>

          {/* Star Rating Picker */}
          <div className="flex justify-center items-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = (hoverRating || rating) >= star;
              return (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      filled
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
              Feedback & Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Share what went well and what you learned..."
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)] shadow-2xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-xl font-semibold text-sm transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Submitting..." : <><Check className="w-4 h-4" /> Submit Review</>}
          </button>
        </form>
      </div>
    </div>
  );
};
