"use client";
import { Monitor, Smartphone, Tablet, Lightbulb, LightbulbOff } from "lucide-react";
import { usePreferences } from "@/context/PreferencesContext";

export default function FloatingToolbar() {
  const { device, theme, setDevice, toggleTheme } = usePreferences();

  const btnBase: React.CSSProperties = {
    width: "36px", height: "36px", borderRadius: "50%", border: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "all 0.2s",
  };

  const activeStyle: React.CSSProperties = {
    ...btnBase,
    background: "var(--gs-gold)",
    color: "#0d0d0d",
  };

  const inactiveStyle: React.CSSProperties = {
    ...btnBase,
    background: "transparent",
    color: "var(--gs-muted)",
  };

  return (
    <div style={{
      position: "fixed", top: "20px", right: "20px", zIndex: 9999,
      display: "flex", gap: "6px", alignItems: "center",
      background: "rgba(13,13,13,0.85)", backdropFilter: "blur(12px)",
      padding: "6px", borderRadius: "9999px",
      border: "1px solid var(--gs-border)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      <button title="Teléfono" onClick={() => setDevice("mobile")}
        style={device === "mobile" ? activeStyle : inactiveStyle}>
        <Smartphone size={16} />
      </button>

      <button title="Tablet" onClick={() => setDevice("tablet")}
        style={device === "tablet" ? activeStyle : inactiveStyle}>
        <Tablet size={16} />
      </button>

      <button title="Escritorio" onClick={() => setDevice("desktop")}
        style={device === "desktop" ? activeStyle : inactiveStyle}>
        <Monitor size={16} />
      </button>

      <div style={{ width: "1px", height: "20px", background: "var(--gs-border)", margin: "0 2px" }} />

      <button title={theme === "dark" ? "Modo claro" : "Modo oscuro"} onClick={toggleTheme}
        style={inactiveStyle}>
        {theme === "dark"
          ? <Lightbulb size={18} color="var(--gs-muted)" />
          : <LightbulbOff size={18} color="var(--gs-gold)" />}
      </button>
    </div>
  );
}
