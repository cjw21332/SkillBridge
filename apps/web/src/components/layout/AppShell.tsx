import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { Compass, Users, MessageSquare, Calendar, User, LogIn, LogOut, Sparkles, Moon, Sun, Newspaper } from "lucide-react";
import { NotificationBell } from "../notifications/NotificationBell";
import { SkillBridgeLogo } from "../ui/SkillBridgeLogo";
import { logout } from "../../api/auth";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || 
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      clearAuth();
      navigate("/login");
    }
  };

  const navItems = [
    { label: "Discover", path: "/", icon: Compass },
    { label: "Feed", path: "/feed", icon: Newspaper },
    { label: "Matches", path: "/matches", icon: Users },
    { label: "Chat", path: "/chat", icon: MessageSquare },
    { label: "Bookings", path: "/bookings", icon: Calendar },
    { label: "Profile", path: "/profile", icon: User },
  ];

  const isAuthPage = location.pathname === "/login";
  const showSidebar = !!accessToken && !isAuthPage;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col md:flex-row transition-colors duration-200 relative">
      {/* Floating Theme Toggle (visible when sidebar is hidden) */}
      {!showSidebar && (
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-[var(--color-border)] text-slate-700 dark:text-slate-200 shadow-sm hover:scale-105 transition-all"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>
      )}

      {/* Sidebar Navigation (Visible only when authenticated and not on login page) */}
      {showSidebar && (
        <aside className="w-full md:w-64 bg-[var(--color-surface)] border-b md:border-r border-[var(--color-border)] p-4 flex flex-col justify-between shrink-0 shadow-2xs z-30 transition-colors duration-200">
          <div>
            <div className="flex items-center justify-between mb-8 px-2">
              <Link to="/" className="hover:opacity-95 transition-opacity">
                <SkillBridgeLogo showText size="md" />
              </Link>
              {accessToken && <NotificationBell />}
            </div>

            <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-[var(--color-primary)] text-white shadow-sm"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]/20 hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-8 pt-4 border-t border-[var(--color-border)] px-2 space-y-2">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
              </div>
              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${theme === "dark" ? "bg-[var(--color-primary)]" : "bg-slate-300"}`}>
                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${theme === "dark" ? "translate-x-4" : ""}`} />
              </div>
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--color-error)] hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area with generous, breathable margins */}
      <main className={`flex-1 ${!showSidebar ? "p-6 sm:p-12 flex items-center justify-center min-h-screen" : "p-6 sm:p-8 lg:p-12 max-w-7xl mx-auto w-full"}`}>
        {children}
      </main>
    </div>
  );
};
