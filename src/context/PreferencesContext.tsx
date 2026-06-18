"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Device = "mobile" | "tablet" | "desktop";
type Theme  = "dark" | "light";

type PreferencesContextValue = {
  device: Device;
  theme: Theme;
  loading: boolean;
  setDevice: (d: Device) => void;
  toggleTheme: () => void;
  deviceWidth: string;
};

const deviceWidths: Record<Device, string> = {
  mobile:  "480px",
  tablet:  "800px",
  desktop: "1200px",
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [device,  setDeviceState] = useState<Device>("mobile");
  const [theme,   setThemeState]  = useState<Theme>("dark");
  const [loading, setLoading]     = useState(true);

  // Load preferences from backend on mount
  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setDeviceState((d.data.device as Device) || "mobile");
          setThemeState((d.data.theme  as Theme)  || "dark");
        }
      })
      .catch((err) => console.error("Error loading preferences:", err))
      .finally(() => setLoading(false));
  }, []);

  // Set CSS variables directly on :root — bypasses any cascade/specificity issues
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.style.setProperty("--gs-dark",          "#f0f0f0");
      root.style.setProperty("--gs-surface",        "#ffffff");
      root.style.setProperty("--gs-surface-glass",  "rgba(255,255,255,0.8)");
      root.style.setProperty("--gs-border",         "rgba(0,0,0,0.1)");
      root.style.setProperty("--gs-muted",          "#666666");
      root.style.setProperty("--gs-text",           "#0d0d0d");
      document.body.style.color      = "#0d0d0d";
      document.body.style.background = "#f0f0f0";
    } else {
      root.style.removeProperty("--gs-dark");
      root.style.removeProperty("--gs-surface");
      root.style.removeProperty("--gs-surface-glass");
      root.style.removeProperty("--gs-border");
      root.style.removeProperty("--gs-muted");
      root.style.removeProperty("--gs-text");
      document.body.style.color      = "";
      document.body.style.background = "";
    }
  }, [theme]);

  const persistPreference = (key: string, value: string) => {
    fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    })
      .then((r) => r.json())
      .then((d) => { if (!d.success) console.error("Failed to persist preference:", d.message); })
      .catch((err) => console.error("Error persisting preference:", err));
  };

  const setDevice = (d: Device) => {
    setDeviceState(d);
    persistPreference("device", d);
  };

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    persistPreference("theme", next);
  };

  return (
    <PreferencesContext.Provider value={{ device, theme, loading, setDevice, toggleTheme, deviceWidth: deviceWidths[device] }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside PreferencesProvider");
  return ctx;
}
