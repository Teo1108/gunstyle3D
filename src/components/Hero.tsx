"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const TEXT_FADE_END = 0.08;  // progress where text fully disappears
const CTA_THRESHOLD = 0.85;  // progress where end CTA appears

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const videoRef   = useRef<HTMLVideoElement | null>(null);
  const tickingRef = useRef(false);
  const textRef    = useRef<HTMLDivElement>(null);

  const [videoReady, setVideoReady] = useState(false);
  const [showCta,    setShowCta]    = useState(false);

  // Draw current video frame to canvas with cover-fit scaling.
  // Called from the 'seeked' event and after canvas resize.
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cw  = canvas.width  / dpr;   // CSS pixels
    const ch  = canvas.height / dpr;
    const vw  = video.videoWidth;
    const vh  = video.videoHeight;
    if (!vw || !vh) return;

    // Cover-fit: scale so the video fills the canvas, centered
    const scale  = Math.max(cw / vw, ch / vh);
    const drawW  = vw * scale;
    const drawH  = vh * scale;
    const drawX  = (cw - drawW) / 2;
    const drawY  = (ch - drawH) / 2;

    ctx.drawImage(video, drawX, drawY, drawW, drawH);
  }, []);

  // ── Video setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const video = document.createElement("video");
    video.src        = "/video/modelo2-header.mp4";
    video.preload    = "auto";
    video.muted      = true;
    video.playsInline = true;
    videoRef.current  = video;

    const onReady  = () => setVideoReady(true);
    const onSeeked = () => drawFrame();

    video.addEventListener("canplaythrough", onReady);
    video.addEventListener("seeked", onSeeked);
    video.load();

    return () => {
      video.removeEventListener("canplaythrough", onReady);
      video.removeEventListener("seeked", onSeeked);
      video.src = "";
    };
  }, [drawFrame]);

  // ── Canvas sizing ─────────────────────────────────────────────────────────
  // Runs once when videoReady becomes true, and on window resize.
  useEffect(() => {
    if (!videoReady) return;

    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width        = window.innerWidth  * dpr;
      canvas.height       = window.innerHeight * dpr;
      canvas.style.width  = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      // Scale context once — all subsequent drawImage calls use CSS pixel coords
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);

      drawFrame();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [videoReady, drawFrame]);

  // ── Scroll handler ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!videoReady) return;

    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      requestAnimationFrame(() => {
        const section = sectionRef.current;
        const video   = videoRef.current;

        if (!section || !video || !video.duration) {
          tickingRef.current = false;
          return;
        }

        const rect       = section.getBoundingClientRect();
        const scrollable = section.offsetHeight - window.innerHeight;
        const progress   = Math.min(1, Math.max(0, -rect.top / scrollable));

        // 1. Seek video → triggers 'seeked' → drawFrame
        video.currentTime = progress * video.duration;

        // 2. Fade text via direct DOM (avoids React re-render on every tick)
        if (textRef.current) {
          const opacity = Math.max(0, 1 - progress / TEXT_FADE_END);
          textRef.current.style.opacity = String(opacity);
        }

        // 3. Toggle CTA — React state is fine because it's a discrete threshold
        setShowCta((prev) => {
          const next = progress >= CTA_THRESHOLD;
          return prev === next ? prev : next;
        });

        tickingRef.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [videoReady]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section
      ref={sectionRef}
      style={{ height: "500vh" }}
      className="relative bg-[#0d0d0d]"
    >
      {/* Sticky viewport — pins to screen while section scrolls */}
      <div
        className="sticky top-0 h-screen overflow-hidden"
        style={{ willChange: "transform", transform: "translateZ(0)" }}
      >
        {/* Canvas — hidden until video is ready to avoid blank flash */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{
            display: videoReady ? "block" : "none",
            willChange: "contents",
          }}
        />

        {/* Dark overlay so text is always legible against the video */}
        <div className="absolute inset-0 bg-black/35 pointer-events-none" />

        {/* ── Centered text (fades out during first 8% of scroll) ── */}
        <div
          ref={textRef}
          className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 pointer-events-none"
        >
          {/* Top-left brand tag */}
          <span className="absolute top-5 left-7 text-[9px] text-zinc-600 tracking-[4px] uppercase select-none">
            GS©2024
          </span>

          {/* Top-right live badge */}
          <div className="absolute top-5 right-7 flex items-center gap-1.5">
            <span className="block w-1.5 h-1.5 rounded-full bg-[#f5a623] animate-pulse" />
            <span className="text-[8px] text-zinc-500 tracking-[3px] uppercase select-none">
              New Drop
            </span>
          </div>

          {/* Eyebrow */}
          <p className="text-[9px] tracking-[6px] uppercase text-[#f5a623] mb-3 opacity-90 select-none">
            Lo que se usa en la calle
          </p>

          {/* Main heading */}
          <h1
            className="font-black uppercase leading-[0.95] tracking-[8px] select-none"
            style={{ fontSize: "clamp(60px, 10vw, 120px)", color: "#ffffff" }}
          >
            GUN
          </h1>
          <h1
            className="font-black uppercase leading-[0.95] tracking-[8px] select-none"
            style={{
              fontSize: "clamp(60px, 10vw, 120px)",
              color: "#f5a623",
              textShadow: "0 0 40px rgba(245,166,35,0.4)",
            }}
          >
            STYLE
          </h1>

          {/* Gold separator line */}
          <div
            className="w-10 h-px my-4"
            style={{
              background: "linear-gradient(90deg, transparent, #f5a623, transparent)",
            }}
          />

          {/* Subtitle */}
          <p className="text-[9px] tracking-[5px] uppercase text-zinc-500 select-none">
            Ropa Oversize · Street Wear
          </p>

          {/* CTA button — pointer-events re-enabled on this child only */}
          <button className="pointer-events-auto mt-5 px-5 py-2 text-[8px] tracking-[4px] uppercase border border-[#f5a623] text-[#f5a623] hover:bg-[#f5a623] hover:text-black transition-colors duration-300">
            Ver Colección →
          </button>

          {/* Scroll hint */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40">
            <span className="text-[7px] text-white tracking-[3px] uppercase select-none">
              Scroll
            </span>
            <div className="w-px h-6 bg-gradient-to-b from-white to-transparent" />
          </div>
        </div>

        {/* ── End-of-scroll CTA overlay (appears at 85% progress) ── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 100%)",
            opacity: showCta ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        >
          <p className="text-[10px] tracking-[6px] uppercase text-[#f5a623] mb-3 select-none">
            GunStyle Street Wear
          </p>
          <h2
            className="font-black uppercase select-none"
            style={{
              fontSize: "clamp(48px, 8vw, 96px)",
              color: "#ffffff",
              lineHeight: 0.95,
              letterSpacing: "6px",
            }}
          >
            SHOP
          </h2>
          <h2
            className="font-black uppercase select-none"
            style={{
              fontSize: "clamp(48px, 8vw, 96px)",
              color: "#f5a623",
              lineHeight: 0.95,
              letterSpacing: "6px",
              textShadow: "0 0 40px rgba(245,166,35,0.4)",
              marginBottom: "2rem",
            }}
          >
            NOW
          </h2>
          <button className="pointer-events-auto px-8 py-3 border border-[#f5a623] text-[#f5a623] text-[10px] tracking-[4px] uppercase hover:bg-[#f5a623] hover:text-black transition-colors duration-300">
            Ver Colección →
          </button>
        </div>
      </div>
    </section>
  );
}
