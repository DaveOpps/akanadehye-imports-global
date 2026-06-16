"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = muted;
    if (!muted) {
      v.play().catch(() => {
        setMuted(true);
      });
    }
  }, [muted]);

  return (
    <>
      <video
        ref={ref}
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute video" : "Mute video"}
        aria-pressed={!muted}
        className="absolute top-5 right-5 z-10 inline-flex items-center gap-2 rounded-full bg-black/40 backdrop-blur border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-black/60 transition"
      >
        {muted ? <IconMuted /> : <IconUnmuted />}
        <span className="hidden sm:inline">{muted ? "Unmute" : "Mute"}</span>
      </button>
    </>
  );
}

function IconMuted() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M11 5L6 9H3v6h3l5 4V5zM17 9l4 4m0-4l-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUnmuted() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M11 5L6 9H3v6h3l5 4V5zM16 8a5 5 0 010 8M19 5a9 9 0 010 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
