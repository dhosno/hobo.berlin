/** Client-side flags from Vite env (`VITE_*`). */

function flag(name: string, fallback = false): boolean {
  const raw = import.meta.env[name];
  if (raw === undefined || raw === "") return fallback;
  return raw === "true" || raw === "1";
}

export const DEV_FREEZE_TIMER = flag("VITE_DEV_FREEZE_TIMER", false);
export const DEV_SKIP_INTRO = flag("VITE_DEV_SKIP_INTRO", false);

export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};
