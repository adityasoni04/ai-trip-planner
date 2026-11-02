import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <img src="/logo.png" alt="" className="h-16 w-16 opacity-80 grayscale" />
        <h1 className="font-display text-3xl font-extrabold">Something went wrong</h1>
        <p className="text-slate-400">An unexpected error occurred. Reloading usually fixes it.</p>
        <button onClick={() => window.location.assign("/")} className="gradient-bg rounded-xl px-5 py-3 font-semibold">
          Back to home
        </button>
      </div>
    );
  }
}
