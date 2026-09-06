import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 1.0,
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div className="p-8 text-center text-red-600">Something went wrong. Please refresh.</div>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
