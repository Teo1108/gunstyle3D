"use client";
import { useState, CSSProperties, ReactNode } from "react";

type Props = {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
  className?: string;
  disabled?: boolean;
  children: ReactNode;
};

export default function PressButton({ onClick, style, className, disabled, children }: Props) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        ...style,
        transform: pressed ? "scale(0.88)" : "scale(1)",
        opacity: pressed ? 0.7 : 1,
        transition: "transform 0.1s ease, opacity 0.1s ease",
      }}
    >
      {children}
    </button>
  );
}
