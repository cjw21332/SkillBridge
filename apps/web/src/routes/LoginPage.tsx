import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register, resetPassword } from "../api/auth";
import { useAuthStore } from "../stores/authStore";
import { Eye, EyeOff, Sparkles, Check, ArrowLeft, KeyRound, Users, Calendar, MessageSquare } from "lucide-react";
import { SkillBridgeLogo } from "../components/ui/SkillBridgeLogo";

type AuthMode = "LOGIN" | "REGISTER" | "FORGOT_PASSWORD";

export const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>("LOGIN");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if ((mode === "REGISTER" || mode === "FORGOT_PASSWORD") && password !== confirmPassword) {
      setError("Passwords do not match. Please verify and try again.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "REGISTER") {
        const res = await register({ email, password, name });
        setAuth(res.data.accessToken, res.data.user);
        navigate("/");
      } else if (mode === "LOGIN") {
        const res = await login({ email, password });
        setAuth(res.data.accessToken, res.data.user);
        navigate("/");
      } else if (mode === "FORGOT_PASSWORD") {
        const res = await resetPassword({ email, password });
        setSuccess(res.data.message || "Password successfully changed! You can now sign in.");
        setTimeout(() => {
          handleModeChange("LOGIN");
        }, 2000);
      }
    } catch (err: any) {
      let errorMessage = err.response?.data?.error?.message;
      if (Array.isArray(errorMessage)) {
        errorMessage = errorMessage.map((e: any) => e.message).join(", ");
      }
      setError(
        errorMessage ||
          err.response?.data?.message ||
          "Authentication operation failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 lg:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        
        {/* Left Column: Facebook-style Hero Brand & Value Prop */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div className="inline-flex justify-center lg:justify-start">
            <SkillBridgeLogo size="xl" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight leading-tight">
              Skill<span className="bg-gradient-to-r from-[var(--color-primary)] to-indigo-600 bg-clip-text text-transparent">Bridge</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
              SkillBridge connects you with real peers worldwide to exchange knowledge and learn faster. Teach one, learn one.
            </p>
          </div>

          {/* Social Proof / Value Prop Bullets */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[var(--color-primary)] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Smart Match</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Match with complementary learners</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1">
              <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-[var(--color-accent)] flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Live Chat</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Real-time chat with read receipts</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Scheduling</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Calendar slots for peer sessions</p>
            </div>
          </div>
        </div>

        {/* Right Column: Facebook-style Authentication Card */}
        <div className="lg:col-span-5 max-w-md w-full mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 transition-colors">
            
            {/* Form Title & Subtitle */}
            <div className="mb-6 text-center">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white">
                {mode === "LOGIN" && "Sign In to SkillBridge"}
                {mode === "REGISTER" && "Create a Free Account"}
                {mode === "FORGOT_PASSWORD" && "Reset Your Password"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {mode === "LOGIN" && "Connect with learning partners around the world."}
                {mode === "REGISTER" && "Join the peer-to-peer learning network."}
                {mode === "FORGOT_PASSWORD" && "Enter your email to set a new password."}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 mb-4 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-300 rounded-xl font-medium border border-red-200 dark:border-red-900/50 animate-in fade-in">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 mb-4 text-xs text-green-700 bg-green-50 dark:bg-green-950/40 dark:text-green-300 rounded-xl font-medium border border-green-200 dark:border-green-900/50 flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === "REGISTER" && (
                <div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-slate-900 dark:text-white transition-all"
                    placeholder="Full name"
                  />
                </div>
              )}

              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-slate-900 dark:text-white transition-all"
                  placeholder="Email address"
                />
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-slate-900 dark:text-white transition-all"
                    placeholder={mode === "FORGOT_PASSWORD" ? "New password (min 8 chars)" : "Password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {(mode === "REGISTER" || mode === "FORGOT_PASSWORD") && (
                <div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:bg-slate-900 dark:text-white transition-all"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Main Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-xl font-bold text-base transition-all shadow-md active:scale-[0.99] disabled:opacity-50 mt-1"
              >
                {loading ? "Please wait..." : mode === "LOGIN" ? "Log In" : mode === "REGISTER" ? "Sign Up" : "Update Password"}
              </button>
            </form>

            {/* Forgot Password Link (Only on LOGIN mode) */}
            {mode === "LOGIN" && (
              <div className="text-center mt-3.5">
                <button
                  onClick={() => handleModeChange("FORGOT_PASSWORD")}
                  className="text-xs text-[var(--color-primary)] hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Return to Login link on FORGOT_PASSWORD mode */}
            {mode === "FORGOT_PASSWORD" && (
              <div className="text-center mt-3.5">
                <button
                  onClick={() => handleModeChange("LOGIN")}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
                </button>
              </div>
            )}

            {/* Facebook-style Divider */}
            {mode !== "FORGOT_PASSWORD" && (
              <>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white dark:bg-slate-800 px-3 text-slate-400 uppercase font-medium tracking-wider">
                      or
                    </span>
                  </div>
                </div>

                {/* Facebook-style Secondary Action Button */}
                <div className="text-center">
                  {mode === "LOGIN" ? (
                    <button
                      onClick={() => handleModeChange("REGISTER")}
                      className="px-6 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-xl font-bold text-sm transition-all shadow-sm active:scale-[0.99]"
                    >
                      Create New Account
                    </button>
                  ) : (
                    <button
                      onClick={() => handleModeChange("LOGIN")}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl font-bold text-sm transition-all shadow-2xs active:scale-[0.99]"
                    >
                      Already have an account? Log In
                    </button>
                  )}
                </div>
              </>
            )}

          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            <span className="font-semibold text-slate-600 dark:text-slate-300">SkillBridge</span> — Teach one, learn one.
          </p>
        </div>

      </div>
    </div>
  );
};
