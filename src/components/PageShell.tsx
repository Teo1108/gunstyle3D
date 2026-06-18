"use client";
import { ReactNode } from "react";
import { usePreferences } from "@/context/PreferencesContext";

export default function PageShell({ children }: { children: ReactNode }) {
  const { deviceWidth, device } = usePreferences();

  return (
    <div
      style={{
        maxWidth: deviceWidth,
        margin: "0 auto",
        minHeight: "100vh",
        background: "var(--gs-dark)",
        borderLeft:  device !== "mobile" ? "1px solid var(--gs-border)" : "none",
        borderRight: device !== "mobile" ? "1px solid var(--gs-border)" : "none",
        transition: "max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}
