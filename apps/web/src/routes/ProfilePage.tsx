import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useProfile, useUpdateProfile } from "../hooks/useProfile";
import { useAuthStore } from "../stores/authStore";
import { 
  User, MapPin, Globe, Plus, X, Check, Star, Heart, MessageSquare, 
  Edit3, Send, Sparkles, Camera, Lock, UserCheck, UserPlus, Calendar, Clock, Image
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { api } from "../lib/api";
import { PostCard } from "../components/feed/PostCard";
import { ProposeSessionModal } from "../components/booking/ProposeSessionModal";
import { SkillAutocompleteInput } from "../components/skills/SkillAutocompleteInput";

const getMyUserId = (token: string | null) => {
  if (!token) return "";
  try { return JSON.parse(atob(token.split(".")[1])).userId; } catch { return ""; }
};

// Curated authentic real human portrait headshots (professional photography, non-AI)
const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&auto=format&fit=crop&q=80",
];

const COVER_PRESETS = [
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
];

export const ProfilePage: React.FC = () => {
  const { accessToken } = useAuthStore();
  const { userId: routeUserId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const myUserId = getMyUserId(accessToken);

  // If routeUserId is specified and different from myUserId, we are stalking another user!
  const isStalking = !!routeUserId && routeUserId !== myUserId;
  const activeUserId = isStalking ? routeUserId : myUserId;

  // File input refs for avatar and cover upload
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [success, setSuccess] = useState("");

  // Skills
  const [teachSkillName, setTeachSkillName] = useState("");
  const [teachCategory, setTeachCategory] = useState("Programming");
  const [learnSkillName, setLearnSkillName] = useState("");
  const [learnCategory, setLearnCategory] = useState("Languages");

  // Post composer
  const [postContent, setPostContent] = useState("");

  // Fetch active profile data (own or other user's)
  const { data: profile, isLoading, refetch } = useQuery(
    ["profile-detail", activeUserId],
    () => api.get(isStalking ? `/users/${activeUserId}` : "/users/me").then((r) => r.data),
    { enabled: !!activeUserId && !!accessToken }
  );

  // Fetch posts by this user (including reposts)
  const { data: userPosts, isLoading: isPostsLoading } = useQuery(
    ["user-posts", activeUserId],
    () => api.get(`/posts/user/${activeUserId}`).then((r) => r.data),
    { enabled: !!activeUserId && !!accessToken }
  );

  // Fetch reviews
  const { data: reviewsData } = useQuery(
    ["user-reviews", activeUserId],
    () => api.get(`/users/${activeUserId}/reviews`).then((res) => res.data),
    { enabled: !!activeUserId }
  );

  const updateProfileMutation = useMutation(
    (data: any) => api.patch("/users/me", data),
    {
      onSuccess: () => {
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        queryClient.invalidateQueries(["profile-detail"]);
        queryClient.invalidateQueries("profile");
        queryClient.invalidateQueries("feed");
      },
    }
  );

  const createPostMutation = useMutation(
    (content: string) => api.post("/posts", { content }),
    {
      onSuccess: () => {
        setPostContent("");
        queryClient.invalidateQueries(["user-posts", activeUserId]);
        queryClient.invalidateQueries("feed");
      },
    }
  );

  const requestMatchMutation = useMutation(
    (requestedToId: string) => api.post("/matches", { requestedToId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["profile-detail", activeUserId]);
        queryClient.invalidateQueries("matches");
      },
    }
  );

  useEffect(() => {
    if (profile && !isStalking) {
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setTimezone(profile.timezone || "");
      setAvatarUrl(profile.avatarUrl || "");
      setCoverUrl(profile.coverUrl || "");
    }
  }, [profile, isStalking]);

  // Auto-dismiss floating toast notification unnoticed in ~6-7 seconds
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      setSuccess("");
    }, 6500);
    return () => clearTimeout(timer);
  }, [success]);

  if (!accessToken) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
        <p className="text-[var(--color-text-secondary)]">Please login to view profiles.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-16 text-[var(--color-text-secondary)]">Loading profile...</div>;
  }

  const isOwner = !isStalking;
  const isConnected = isOwner || !!profile?.isConnected;

  // Signed Cloudinary upload helper (Phase 3 spec); falls back to base64 data URL when credentials are invalid
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const sigRes = await api.post("/users/me/upload-signature");
    const { signature, timestamp, apiKey, cloudName, folder } = sigRes.data;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || "Cloudinary image upload failed");
    }

    const json = await res.json();
    return json.secure_url;
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Handle file upload for Avatar using signed Cloudinary; falls back to base64 on failure
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSuccess("Uploading image...");
      let url: string;
      try {
        url = await uploadToCloudinary(file);
      } catch {
        url = await fileToBase64(file);
      }
      setAvatarUrl(url);
      await updateProfileMutation.mutateAsync({ avatarUrl: url });
      setSuccess("Avatar updated successfully!");
    } catch (err: any) {
      console.error("Avatar upload failed", err);
      setSuccess("");
      alert("Failed to upload image.");
    }
  };

  // Handle file upload for Cover Photo using signed Cloudinary; falls back to base64 on failure
  const handleCoverFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSuccess("Uploading cover...");
      let url: string;
      try {
        url = await uploadToCloudinary(file);
      } catch {
        url = await fileToBase64(file);
      }
      setCoverUrl(url);
      await updateProfileMutation.mutateAsync({ coverUrl: url });
      setSuccess("Cover photo updated successfully!");
    } catch (err: any) {
      console.error("Cover upload failed", err);
      setSuccess("");
      alert("Failed to upload image.");
    }
  };

  const handleSelectPresetAvatar = async (presetUrl: string) => {
    setAvatarUrl(presetUrl);
    setShowIconPicker(false);
    try {
      await updateProfileMutation.mutateAsync({ avatarUrl: presetUrl });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectPresetCover = async (presetUrl: string) => {
    setCoverUrl(presetUrl);
    try {
      await updateProfileMutation.mutateAsync({ coverUrl: presetUrl });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    try {
      await updateProfileMutation.mutateAsync({ bio, location, timezone, avatarUrl, coverUrl });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAddSkill = async (type: "TEACH" | "LEARN", customName?: string, customCat?: string) => {
    const name = customName || (type === "TEACH" ? teachSkillName : learnSkillName);
    const category = customCat || (type === "TEACH" ? teachCategory : learnCategory);
    if (!name.trim()) return;
    try {
      const skillRes = await api.post("/skills", { name, category });
      const skillId = skillRes.data.id;
      const existingTeach = (profile?.teachSkills || []).map((s: any) => ({ skillId: s.skillId, level: s.level }));
      const existingLearn = (profile?.learnSkills || []).map((s: any) => ({ skillId: s.skillId }));
      if (type === "TEACH") {
        if (!existingTeach.some((s: any) => s.skillId === skillId)) {
          existingTeach.push({ skillId, level: 3 });
        }
        setTeachSkillName("");
      } else {
        if (!existingLearn.some((s: any) => s.skillId === skillId)) {
          existingLearn.push({ skillId });
        }
        setLearnSkillName("");
      }
      await api.put("/users/me/skills", { teachSkills: existingTeach, learnSkills: existingLearn });
      setSuccess(`"${name}" added to skills!`);
      refetch();
    } catch (err) {
      console.error("Failed to add skill", err);
    }
  };

  const handleRemoveSkill = async (type: "TEACH" | "LEARN", skillId: string) => {
    try {
      let existingTeach = (profile?.teachSkills || []).map((s: any) => ({
        skillId: s.skillId,
        level: s.level,
      }));
      let existingLearn = (profile?.learnSkills || []).map((s: any) => ({
        skillId: s.skillId,
      }));

      let removedName = "";
      if (type === "TEACH") {
        const item = (profile?.teachSkills || []).find((s: any) => s.skillId === skillId);
        removedName = item?.skill?.name || "Skill";
        existingTeach = existingTeach.filter((s: any) => s.skillId !== skillId);
      } else {
        const item = (profile?.learnSkills || []).find((s: any) => s.skillId === skillId);
        removedName = item?.skill?.name || "Skill";
        existingLearn = existingLearn.filter((s: any) => s.skillId !== skillId);
      }

      await api.put("/users/me/skills", { teachSkills: existingTeach, learnSkills: existingLearn });
      setSuccess(`"${removedName}" removed from skills.`);
      refetch();
    } catch (err) {
      console.error("Failed to remove skill", err);
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    createPostMutation.mutate(postContent.trim());
  };

  const posts = userPosts || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Hidden file inputs for avatar & cover uploads */}
      {isOwner && (
        <>
          <input
            type="file"
            ref={avatarFileInputRef}
            onChange={handleAvatarFileSelect}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={coverFileInputRef}
            onChange={handleCoverFileSelect}
            accept="image/*"
            className="hidden"
          />
        </>
      )}

      {/* Cover Photo Area (Facebook-identical geometry) */}
      <div className="relative h-60 sm:h-72 md:h-80 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-t-3xl overflow-hidden shadow-sm group">
        {profile?.coverUrl && (
          <img src={profile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Change Cover Photo Button (Facebook-identical bottom-right position) */}
        {isOwner && (
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
            <button
              onClick={() => coverFileInputRef.current?.click()}
              className="px-3.5 py-2 bg-slate-900/75 hover:bg-slate-900/90 text-white rounded-xl text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              title="Upload cover photo from your computer"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Edit Cover Photo</span>
            </button>
          </div>
        )}
      </div>

      {/* Profile Header (Facebook-identical overlapping circular avatar bar) */}
      <div className="bg-white dark:bg-[#151D2F] border-x border-b border-[var(--color-border)] px-6 sm:px-10 pb-8 pt-0 relative rounded-b-3xl shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-20 md:-mt-24">
          {/* Circular Avatar overlapping cover (Facebook style) */}
          <div className="relative group shrink-0">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-[5px] border-white dark:border-[#151D2F] bg-gradient-to-br from-[var(--color-primary)] to-indigo-600 flex items-center justify-center text-white text-5xl font-bold shadow-xl overflow-hidden transition-colors ring-4 ring-white dark:ring-[#151D2F]">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile?.name?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>

            {/* Camera Badge on Avatar */}
            {isOwner && (
              <button
                onClick={() => avatarFileInputRef.current?.click()}
                className="absolute bottom-2 right-2 p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[var(--color-primary)] hover:bg-slate-200 rounded-full shadow-lg border-2 border-white dark:border-[#151D2F] transition-all active:scale-95"
                title="Upload profile picture from device"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left pb-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white">{profile?.name}</h1>
              {isConnected && isStalking && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-emerald-950/40 text-[var(--color-success)] text-xs font-semibold rounded-full border border-green-200 dark:border-emerald-800/40 w-max mx-auto sm:mx-0">
                  <UserCheck className="w-3.5 h-3.5" /> Connected Partner
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-xl leading-relaxed">{profile?.bio || "No bio added yet."}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 mt-3 text-xs text-[var(--color-text-secondary)]">
              {profile?.location && (
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>
              )}
              {profile?.timezone && (
                <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />{profile.timezone}</span>
              )}
              {reviewsData?.total > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {reviewsData.averageRating?.toFixed(1)} ({reviewsData.total} reviews)
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pb-1">
            {isOwner ? (
              <>
                <button
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-50 dark:bg-indigo-950/40 hover:bg-blue-100 dark:hover:bg-indigo-900/50 text-[var(--color-primary)] text-xs font-semibold rounded-xl transition-all shadow-2xs border border-blue-200/60 dark:border-indigo-800/40"
                  title="Choose from authentic photo portraits"
                >
                  <UserCheck className="w-4 h-4" /> Avatar Presets
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl transition-all shadow-2xs"
                >
                  <Edit3 className="w-4 h-4" /> {isEditing ? "Close" : "Edit Profile"}
                </button>
              </>
            ) : isConnected ? (
              <>
                {profile?.matchId && (
                  <Link
                    to={`/chat?matchId=${profile.matchId}`}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" /> Message
                  </Link>
                )}
                <button
                  onClick={() => setIsSessionModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl transition-all border border-indigo-200 dark:border-indigo-800 shadow-2xs active:scale-95"
                >
                  <Calendar className="w-4 h-4" /> Propose Session
                </button>
              </>
            ) : (
              <button
                onClick={() => requestMatchMutation.mutate(activeUserId!)}
                disabled={profile?.matchStatus === "PENDING" || requestMatchMutation.isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 active:scale-95"
              >
                {profile?.matchStatus === "PENDING" ? (
                  <>
                    <Clock className="w-4 h-4" /> Request Pending
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Request Match
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Icon & Avatar Presets Selector Box */}
        {showIconPicker && isOwner && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Pick an Authentic Profile Photo (One-Click)
              </h4>
              <button onClick={() => setShowIconPicker(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPresetAvatar(preset)}
                  className="w-12 h-12 rounded-full border-2 border-slate-200 hover:border-[var(--color-primary)] hover:scale-105 transition-all p-0.5 bg-white shadow-xs overflow-hidden"
                >
                  <img src={preset} alt="" className="w-full h-full rounded-full object-cover" />
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200">
              <h5 className="font-bold text-[11px] text-slate-600 mb-2">Or Choose a Beautiful Cover Banner:</h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COVER_PRESETS.map((cp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPresetCover(cp)}
                    className="h-12 rounded-lg overflow-hidden border border-slate-200 hover:border-[var(--color-primary)] hover:scale-102 transition-all shadow-2xs"
                  >
                    <img src={cp} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Form Modal (Owner only) */}
      {isEditing && isOwner && (
        <form onSubmit={handleUpdate} className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm space-y-4 mt-4 animate-in fade-in duration-200">
          <h3 className="font-bold text-base text-slate-800 border-b pb-2">Edit Your Profile</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Avatar Image URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Cover Photo URL</label>
              <input
                type="text"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder="https://example.com/cover.jpg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="Tell other learners about your skills and goals..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder="e.g. San Francisco, CA"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--color-border)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder="e.g. UTC-8"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isLoading}
              className="px-5 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-semibold rounded-xl shadow-xs"
            >
              {updateProfileMutation.isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {/* Main Grid Layout: Left sidebar (Skills & Reviews), Right side (Timeline / Stalking feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-4">

        {/* Left Column: Skills & About */}
        <div className="lg:col-span-5 space-y-6">
          {/* Skills I Can Teach */}
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-7 rounded-3xl border border-[var(--color-border)] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-700/50">
              <h3 className="font-bold text-sm text-[var(--color-primary)]">Skills Taught</h3>
              <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                {(profile?.teachSkills || []).length} active
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {(profile?.teachSkills || []).map((s: any) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[var(--color-primary)] rounded-full text-xs font-semibold group transition-all shadow-2xs"
                >
                  <span>{s.skill?.name}</span>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill("TEACH", s.skillId)}
                      className="text-blue-400 hover:text-red-500 hover:bg-blue-100 dark:hover:bg-red-950/40 rounded-full p-0.5 transition-colors ml-0.5"
                      title={`Remove ${s.skill?.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
              {(profile?.teachSkills || []).length === 0 && (
                <span className="text-xs text-[var(--color-text-secondary)] py-1">No skills listed yet</span>
              )}
            </div>
            {isOwner && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <SkillAutocompleteInput
                  type="TEACH"
                  placeholder="Search or add a skill you teach..."
                  onAddSkill={(name, cat) => handleAddSkill("TEACH", name, cat)}
                />
              </div>
            )}
          </div>

          {/* Skills I Want to Learn */}
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-7 rounded-3xl border border-[var(--color-border)] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-700/50">
              <h3 className="font-bold text-sm text-[var(--color-accent)]">Wants to Learn</h3>
              <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                {(profile?.learnSkills || []).length} active
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {(profile?.learnSkills || []).map((s: any) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-[var(--color-accent)] rounded-full text-xs font-semibold group transition-all shadow-2xs"
                >
                  <span>{s.skill?.name}</span>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill("LEARN", s.skillId)}
                      className="text-orange-400 hover:text-red-500 hover:bg-orange-100 dark:hover:bg-red-950/40 rounded-full p-0.5 transition-colors ml-0.5"
                      title={`Remove ${s.skill?.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
              {(profile?.learnSkills || []).length === 0 && (
                <span className="text-xs text-[var(--color-text-secondary)] py-1">No skills listed yet</span>
              )}
            </div>
            {isOwner && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <SkillAutocompleteInput
                  type="LEARN"
                  placeholder="Search or add a skill to learn..."
                  onAddSkill={(name, cat) => handleAddSkill("LEARN", name, cat)}
                />
              </div>
            )}
          </div>

          {/* Reviews List */}
          {reviewsData?.reviews && reviewsData.reviews.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-7 rounded-3xl border border-[var(--color-border)] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-700/50">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Peer Reviews</h3>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {reviewsData.averageRating?.toFixed(1)}
                </span>
              </div>
              <div className="space-y-3 pt-1">
                {reviewsData.reviews.slice(0, 3).map((r: any) => (
                  <div key={r.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {r.author?.name?.charAt(0) || "U"}
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{r.author?.name}</span>
                      <div className="flex gap-0.5 ml-auto">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"}`} />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-slate-600 dark:text-slate-300 pl-8 leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Timeline / Stalking Posts */}
        <div className="lg:col-span-7 space-y-6">
          {/* Post Composer (Owner only) */}
          {isOwner && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-[var(--color-border)] shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex gap-3.5 items-start">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-2xs">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    profile?.name?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={2}
                  placeholder="What's on your mind? Share a skill milestone or tip..."
                  className="w-full text-sm p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all resize-none leading-relaxed"
                />
              </div>
              <div className="flex justify-end pt-1 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  onClick={handleCreatePost}
                  disabled={!postContent.trim() || createPostMutation.isLoading}
                  className="px-5 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{createPostMutation.isLoading ? "Posting..." : "Post"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Privacy Wall Banner when Stalking Non-Friends */}
          {isStalking && !isConnected ? (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-10 text-center shadow-xs space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-800">Timeline is Private</h4>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-sm mx-auto">
                  You must be connected friends with {profile?.name} to stalk their full learning updates, view posts, and interact.
                </p>
              </div>
              <button
                onClick={() => requestMatchMutation.mutate(activeUserId!)}
                disabled={profile?.matchStatus === "PENDING" || requestMatchMutation.isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {profile?.matchStatus === "PENDING" ? "Match Request Sent" : `Connect with ${profile?.name?.split(" ")[0]}`}
              </button>
            </div>
          ) : isPostsLoading ? (
            <div className="text-center py-8 text-xs text-[var(--color-text-secondary)]">
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-10 text-center shadow-xs">
              <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-800">No posts yet</h4>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                {isOwner ? "Share your first learning milestone or skill tip!" : `${profile?.name} hasn't posted anything yet.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((p: any) => (
                <PostCard key={p.id} post={p} currentUserId={myUserId} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Propose Session Modal for Connected Stalking */}
      {isStalking && isConnected && profile && (
        <ProposeSessionModal
          isOpen={isSessionModalOpen}
          onClose={() => setIsSessionModalOpen(false)}
          matchId={profile.matchId}
          partnerName={profile.name}
          partnerId={profile.id}
          onBookingProposed={() => {
            queryClient.invalidateQueries("bookings");
          }}
        />
      )}
      {/* Floating Bottom-Right Toast Modal (auto-dismisses in 6.5s and has X button) */}
      {success && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h5 className="font-bold text-xs text-slate-900 dark:text-white">Profile Updated</h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{success}</p>
            </div>
          </div>
          <button
            onClick={() => setSuccess("")}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
