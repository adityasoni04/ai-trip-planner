import { useSyncExternalStore } from "react";

const root = () => document.documentElement;
const isDark = () => root().classList.contains("dark");

function subscribe(cb) {
  const obs = new MutationObserver(cb);
  obs.observe(root(), { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

/** true when the dark theme is active (reactive). */
export const useDark = () => useSyncExternalStore(subscribe, isDark, () => true);

export function setTheme(dark) {
  root().classList.toggle("dark", dark);
  try {
    localStorage.setItem("theme", dark ? "dark" : "light");
  } catch {
    /* storage unavailable */
  }
}
