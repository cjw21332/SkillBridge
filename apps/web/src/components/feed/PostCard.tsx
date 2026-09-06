import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { api } from "../../lib/api";
import { Heart, MessageCircle, Repeat2, Send, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";

interface PostCardProps {
  post: any;
  currentUserId: string;
}

export const PostCard: React.FC<PostCardProps> = ({ post, currentUserId }) => {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isReposting, setIsReposting] = useState(false);
  const [repostText, setRepostText] = useState("");

  const isLiked = (post.likes || []).some((l: any) => l.userId === currentUserId);
  const likesCount = post._count?.likes ?? (post.likes?.length || 0);
  const commentsCount = post._count?.comments ?? (post.comments?.length || 0);
  const repostsCount = post._count?.reposts || 0;

  const likeMutation = useMutation(
    () => api.post(`/posts/${post.id}/like`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("feed");
        queryClient.invalidateQueries(["user-posts"]);
      },
    }
  );

  const commentMutation = useMutation(
    (content: string) => api.post(`/posts/${post.id}/comment`, { content }),
    {
      onSuccess: () => {
        setCommentText("");
        queryClient.invalidateQueries("feed");
        queryClient.invalidateQueries(["user-posts"]);
      },
    }
  );

  const repostMutation = useMutation(
    (content: string) => api.post(`/posts/${post.id}/repost`, { content }),
    {
      onSuccess: () => {
        setIsReposting(false);
        setRepostText("");
        queryClient.invalidateQueries("feed");
        queryClient.invalidateQueries(["user-posts"]);
      },
    }
  );

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText.trim());
  };

  const handleRepostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    repostMutation.mutate(repostText.trim());
  };

  const isRepost = !!post.originalPost;
  const original = post.originalPost;
  // For reposts, the card body (avatar, name, timestamp, content) always belongs to the ORIGINAL author
  const cardAuthor = (original && original.author) ? original.author : (post.author || {});
  const cardAuthorId = (original && original.authorId) ? original.authorId : (post.authorId || post.author?.id);
  const cardAvatarUrl = original?.author?.avatarUrl || original?.author?.avatarUrl || post.author?.avatarUrl || post.author?.avatarUrl;
  const cardCreatedAt = original?.createdAt || post.createdAt;
  const cardContent = original?.content || post.content || "";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-[var(--color-border)] shadow-sm overflow-hidden transition-colors">
      {/* Repost Header */}
      {isRepost && (
        <div className="bg-slate-50 dark:bg-slate-900/60 px-6 py-2.5 border-b border-slate-100 dark:border-slate-750 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Repeat2 className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">{post.author?.name}</span> reposted
        </div>
      )}

      <div className="p-6 sm:p-7 space-y-5">
        {/* Author Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Link
              to={`/profile/${cardAuthorId}`}
              className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 hover:opacity-90 transition-opacity overflow-hidden"
            >
              {cardAuthor?.avatarUrl ? (
                <img src={cardAuthor.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                cardAuthor?.name?.charAt(0)?.toUpperCase() || "U"
              )}
            </Link>
            <div>
              <Link
                to={`/profile/${cardAuthorId}`}
                className="font-bold text-sm text-slate-900 dark:text-white hover:underline hover:text-[var(--color-primary)] transition-colors block"
              >
                {cardAuthor?.name}
              </Link>
              <span className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                {new Date(cardCreatedAt).toLocaleDateString([], { month: "short", day: "numeric" })} at{" "}
                {new Date(cardCreatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>

        {/* Post Text */}
        {cardContent && (
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
            {cardContent}
          </p>
        )}

        {/* Action Counters & Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-5">
            <button
              onClick={() => likeMutation.mutate()}
              className={`flex items-center gap-1.5 transition-colors py-1.5 px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 ${
                isLiked ? "text-red-500 font-bold" : "text-slate-600 dark:text-slate-300 hover:text-red-500"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
              <span>{likesCount} {likesCount === 1 ? "Like" : "Likes"}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-[var(--color-primary)] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{commentsCount} {commentsCount === 1 ? "Comment" : "Comments"}</span>
            </button>

            <button
              onClick={() => setIsReposting(!isReposting)}
              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-green-600 transition-colors"
            >
              <Repeat2 className="w-4 h-4" />
              <span>{repostsCount > 0 ? repostsCount : ""} Repost</span>
            </button>
          </div>
        </div>

        {/* Repost Input Box (when triggered) */}
        {isReposting && (
          <form onSubmit={handleRepostSubmit} className="pt-3 border-t border-slate-100 space-y-2">
            <input
              type="text"
              placeholder="Add your thoughts to this repost (optional)..."
              value={repostText}
              onChange={(e) => setRepostText(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReposting(false)}
                className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={repostMutation.isLoading}
                className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold"
              >
                {repostMutation.isLoading ? "Reposting..." : "Repost Now"}
              </button>
            </div>
          </form>
        )}

        {/* Comments Section */}
        {showComments && (
          <div className="pt-3 border-t border-slate-100 space-y-3">
            {/* New Comment Input */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-full bg-slate-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || commentMutation.isLoading}
                className="px-3 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-full text-xs font-semibold disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Comment List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(post.comments || []).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">No comments yet. Be the first to reply!</p>
              ) : (
                (post.comments || []).map((c: any) => (
                  <div key={c.id} className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl">
                    <Link
                      to={`/profile/${c.authorId}`}
                      className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center shrink-0 hover:opacity-90 overflow-hidden"
                    >
                      {c.author?.avatarUrl ? (
                        <img src={c.author.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        c.author?.name?.charAt(0)?.toUpperCase() || "U"
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link to={`/profile/${c.authorId}`} className="font-bold text-xs text-slate-800 hover:underline">
                          {c.author?.name}
                        </Link>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-0.5 whitespace-pre-line">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
