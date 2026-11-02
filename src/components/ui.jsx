import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PinLoader, SegSpinner } from "./Loaders";

const variants = {
  primary: "bg-slate-50 text-slate-950 hover:opacity-85 active:scale-[0.98]",
  outline: "border border-slate-50/15 bg-slate-50/5 text-slate-100 backdrop-blur hover:border-teal-300/50 hover:bg-slate-50/10",
  ghost: "text-slate-300 hover:bg-slate-50/10 hover:text-slate-50",
  danger: "bg-brand-coral text-white hover:brightness-110",
};
const sizes = { sm: "h-9 px-3.5 text-sm", md: "h-11 px-5 text-sm", lg: "h-12 px-7 text-base" };

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <SegSpinner />}
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center print:hidden">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="glow-border relative max-h-[90vh] w-full max-w-md animate-fade-up overflow-y-auto p-6">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-50/10 hover:text-slate-50">
          <X className="h-5 w-5" />
        </button>
        {title && <h2 className="font-display pr-8 text-xl font-bold">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export const Spinner = ({ label }) => <PinLoader label={label} />;

export const Skeleton = ({ className }) => <div className={cn("shimmer rounded-2xl", className)} />;

export const Chip = ({ children, className }) => <span className={cn("tag !text-sm", className)}>{children}</span>;
