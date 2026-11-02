import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Map, Menu, Moon, Sun, X } from "lucide-react";
import { Button } from "./ui";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { setTheme, useDark } from "@/lib/theme";

function ThemeToggle() {
  const dark = useDark();
  return (
    <button
      onClick={() => setTheme(!dark)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-slate-50/10 hover:text-slate-50"
    >
      {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const initial = (user.displayName || user.email || "?")[0].toUpperCase();
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="rounded-full p-0.5 ring-2 ring-teal-300/40 transition hover:ring-teal-300" aria-label="Account menu">
        {user.photoURL ? (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <span className="gradient-bg flex h-9 w-9 items-center justify-center rounded-full font-bold">{initial}</span>
        )}
      </button>
      {open && (
        <div className="card absolute right-0 mt-3 w-60 animate-fade-up overflow-hidden p-1.5">
          <div className="border-b border-slate-50/10 px-3 py-2">
            <p className="truncate text-sm font-semibold text-slate-50">{user.displayName || "Traveller"}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              navigate("/my-trips");
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50/10"
          >
            <Map className="h-4 w-4 text-brand-teal" /> My trips
          </button>
          <button
            onClick={() => {
              setOpen(false);
              logout();
              navigate("/");
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-coral hover:bg-brand-coral/10"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const { user, loading, openAuth } = useAuth();
  const [mobile, setMobile] = useState(false);
  const link = ({ isActive }) =>
    cn("border-b-2 px-1 py-1 text-sm font-medium transition", isActive ? "border-slate-50 text-slate-50" : "border-transparent text-slate-400 hover:text-slate-50");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-50/10 bg-slate-950/85 backdrop-blur-md print:hidden">
      <div className="mx-auto max-w-6xl">
        <div className="flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobile(false)}>
            <img src="/logo.png" alt="Xplore.ai" className="h-8 w-8" />
            <span className="font-display text-xl text-slate-50">
              Xplore<span className="gradient-text">.ai</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <NavLink to="/" end className={link}>Home</NavLink>
            <NavLink to="/plan-a-trip" className={link}>Plan a trip</NavLink>
            {user && <NavLink to="/my-trips" className={link}>My trips</NavLink>}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!loading && (user ? <UserMenu /> : <Button size="sm" onClick={openAuth}>Sign in</Button>)}
            <button className="rounded-xl p-2 text-slate-300 md:hidden" aria-label="Menu" onClick={() => setMobile(!mobile)}>
              {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobile && (
          <nav className="flex flex-col gap-3 border-t border-slate-50/10 px-4 py-4 md:hidden" onClick={() => setMobile(false)}>
            <NavLink to="/" end className={link}>Home</NavLink>
            <NavLink to="/plan-a-trip" className={link}>Plan a trip</NavLink>
            {user && <NavLink to="/my-trips" className={link}>My trips</NavLink>}
          </nav>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-50/10 py-10 text-center text-sm text-slate-500 print:hidden">
      <div className="flex items-center justify-center gap-2">
        <img src="/logo.png" alt="" className="h-5 w-5" />
        <span>
          Xplore.ai · Made by{" "}
          <a className="font-semibold text-teal-300 hover:underline" href="https://github.com/adityasoni04" target="_blank" rel="noreferrer">
            Aditya Soni
          </a>
        </span>
      </div>
      <p className="mt-2 text-xs">Itineraries are AI-generated. Verify prices and opening hours before you travel.</p>
    </footer>
  );
}
