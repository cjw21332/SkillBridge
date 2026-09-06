import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { AppShell } from "./components/layout/AppShell";
import { DiscoverPage } from "./routes/DiscoverPage";
import { FeedPage } from "./routes/FeedPage";
import { MatchesPage } from "./routes/MatchesPage";
import { ChatPage } from "./routes/ChatPage";
import { BookingsPage } from "./routes/BookingsPage";
import { ProfilePage } from "./routes/ProfilePage";
import { LoginPage } from "./routes/LoginPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache staleTime
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppShell>
          <Routes>
            <Route path="/" element={<DiscoverPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AppShell>
      </Router>
    </QueryClientProvider>
  );
}
