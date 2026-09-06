import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import { useProfile } from "../hooks/useProfile";
import { getSocket } from "../lib/socket";
import { PostCard } from "../components/feed/PostCard";
import { Sparkles, Send, MessageSquare, Image, Users } from "lucide-react";
import { Link } from "react-router-dom";

export const FeedPage: React.FC = () => {
  const { accessToken } = useAuthStore();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data: posts, isLoading } = useQuery(
    "feed",
    () => api.get("/posts/feed").then((res) => res.data),
    { enabled: !!accessToken }
  );

  const createPostMutation = useMutation(
    (text: string) => api.post("/posts", { content: text }),
    {
      onSuccess: () => {
        setContent("");
        queryClient.invalidateQueries("feed");
      },
    }
  );

  // Real-time socket events for live feed updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewPost = () => {
      queryClient.invalidateQueries("feed");
    };

    const onLikeUpdate = () => {
      queryClient.invalidateQueries("feed");
    };

    const onCommentNew = () => {
      queryClient.invalidateQueries("feed");
    };

    socket.on("feed:new_post", onNewPost);
    socket.on("post:like_update", onLikeUpdate);
    socket.on("post:comment_new", onCommentNew);

    return () => {
      socket.off("feed:new_post", onNewPost);
      socket.off("post:like_update", onLikeUpdate);
      socket.off("post:comment_new", onCommentNew);
    };
  }, [queryClient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createPostMutation.mutate(content.trim());
  };

  if (!accessToken) {
    return (
      <div className="text-center py-12 text-[var(--color-text-secondary)]">
        Please login to view your news feed.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white">Community Feed</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Stay connected with learning partners, share progress, and exchange tips.
        </p>
      </div>

      {/* "What's on your mind?" Composer */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-[var(--color-border)] shadow-sm p-6 sm:p-7 space-y-4">
        <div className="flex gap-4 items-start">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-2xs">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              profile?.name?.charAt(0)?.toUpperCase() || "U"
            )}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder={`What's on your mind, ${profile?.name?.split(" ")[0] || "there"}? Share a skill update or tip...`}
            className="w-full text-sm p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all resize-none leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
          <span className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[var(--color-primary)]" /> Visible to learning partners
          </span>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || createPostMutation.isLoading}
            className="px-6 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{createPostMutation.isLoading ? "Posting..." : "Post"}</span>
          </button>
        </div>
      </div>

      {/* Post List with clean breathing space */}
      {isLoading ? (
        <div className="text-center py-16 text-sm text-[var(--color-text-secondary)]">
          Loading your feed...
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-[var(--color-border)] p-12 text-center shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[var(--color-primary)] flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">No posts yet</h3>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto leading-relaxed">
            Connect with peers in Discover or publish your very first skill update above!
          </p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-xs font-semibold shadow-xs hover:opacity-90"
          >
            Discover Partners
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post: any) => (
            <PostCard key={post.id} post={post} currentUserId={profile?.id || ""} />
          ))}
        </div>
      )}
    </div>
  );
};
