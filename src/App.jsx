import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Footer, Navbar } from "./components/Layout";
import { Button } from "./components/ui";
import { PinLoader } from "./components/Loaders";
import { useAuth } from "./context/AuthContext";
import { firebaseConfigured } from "./lib/firebase";
import Home from "./pages/Home";
import CreateTrip from "./pages/CreateTrip";
import MyTrips from "./pages/MyTrips";
import TripDetail from "./pages/TripDetail";

function SetupNotice() {
  const keys = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
    "VITE_GEMINI_API_KEY",
  ];
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <div className="glow-border p-8">
        <h1 className="font-display text-2xl font-extrabold">Almost there — add your keys</h1>
        <p className="mt-2 text-slate-400">
          Create a <code className="rounded bg-slate-50/10 px-1">.env</code> file in the project root (copy{" "}
          <code className="rounded bg-slate-50/10 px-1">.env.example</code>) with these values, then restart{" "}
          <code className="rounded bg-slate-50/10 px-1">npm run dev</code>:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-50/5 p-4 font-mono text-xs text-teal-300">{keys.map((k) => `${k}=`).join("\n")}</pre>
        <p className="mt-4 text-sm text-slate-500">See the README for where to find each value.</p>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function RequireAuth({ children }) {
  const { user, loading, openAuth } = useAuth();
  if (loading)
    return <PinLoader label="Checking your session" />;
  if (!user)
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Sign in to continue</h1>
        <p className="mt-2 text-slate-500">Your trips are saved to your account.</p>
        <Button className="mt-6" size="lg" onClick={openAuth}>Sign in</Button>
      </div>
    );
  return children;
}

export default function App() {
  if (!firebaseConfigured) return <SetupNotice />;
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <ScrollToTop />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plan-a-trip" element={<CreateTrip />} />
          <Route path="/my-trips" element={<RequireAuth><MyTrips /></RequireAuth>} />
          <Route path="/trip/:id" element={<TripDetail />} />
          <Route path="/all-trips" element={<Navigate to="/my-trips" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
