import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { api } from "./api";
import { useAuth } from "./AuthContext";

export const APPEARANCE_DEFAULTS = {
  direction: "playful",
  lead: "sky",
  roundness: 18,
  font: "Jakarta",
  density: "cozy",
  showHero: true,
};

const LOCAL_KEY = "nucorns_appearance";
const AppearanceContext = createContext(null);

function loadLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
    return { ...APPEARANCE_DEFAULTS, ...saved };
  } catch (e) {
    return { ...APPEARANCE_DEFAULTS };
  }
}

export function AppearanceProvider({ children }) {
  const { user } = useAuth();
  const [appearance, setAppearanceState] = useState(loadLocal);

  useEffect(() => {
    if (user && user.appearance && Object.keys(user.appearance).length) {
      setAppearanceState({ ...APPEARANCE_DEFAULTS, ...user.appearance });
    }
  }, [user]);

  const setAppearance = useCallback(async (patch) => {
    setAppearanceState((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);

  // persist to the account once settled, when signed in
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      api.put("/users/me/appearance", { appearance }).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [appearance, user]);

  const rootProps = useMemo(() => ({
    "data-direction": appearance.direction,
    "data-density": appearance.density,
    style: {
      "--accent": appearance.lead === "orange" ? "var(--orange)" : "var(--sky)",
      "--accent-2": appearance.lead === "orange" ? "var(--sky)" : "var(--orange)",
      "--radius": appearance.roundness + "px",
      "--font": appearance.font === "Sora" ? "'Sora', sans-serif"
        : appearance.font === "Hanken" ? "'Hanken Grotesque', sans-serif"
        : "'Plus Jakarta Sans', sans-serif",
    },
  }), [appearance]);

  return (
    <AppearanceContext.Provider value={{ appearance, setAppearance, rootProps }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used within AppearanceProvider");
  return ctx;
}
