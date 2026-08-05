"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const safe = images.length > 0 ? images : ["/placeholder.png"];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setLightbox(false); setZoomed(false); }
      if (e.key === "ArrowRight") setActive((a) => (a + 1) % safe.length);
      if (e.key === "ArrowLeft") setActive((a) => (a - 1 + safe.length) % safe.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, safe.length]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  function prev() { setActive((a) => (a - 1 + safe.length) % safe.length); setZoomed(false); }
  function next() { setActive((a) => (a + 1) % safe.length); setZoomed(false); }

  return (
    <>
      <div className="space-y-3">
        {/* Main image — click to open lightbox */}
        <button
          onClick={() => setLightbox(true)}
          className="group relative w-full aspect-square rounded-2xl overflow-hidden bg-[color:var(--brand-cream)] border border-[color:var(--border)] cursor-zoom-in"
          aria-label="View full image"
        >
          <Image
            src={safe[active]}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-contain p-8 transition duration-300 group-hover:scale-105"
            unoptimized
            priority
          />
          {/* Zoom hint overlay */}
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/50 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15.5 15.5L20 20M10 17a7 7 0 110-14 7 7 0 010 14zM10 7v6M7 10h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Zoom
          </span>
          {/* Image counter badge */}
          {safe.length > 1 && (
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/40 text-white text-xs font-semibold pointer-events-none">
              {active + 1} / {safe.length}
            </span>
          )}
        </button>

        {/* Thumbnails */}
        {safe.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {safe.slice(0, 5).map((src, i) => (
              <button
                key={src + i}
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                  active === i
                    ? "border-[color:var(--brand-navy)]"
                    : "border-[color:var(--border)] hover:border-[color:var(--brand-gold)]"
                }`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="20vw"
                  className="object-contain p-2 bg-[color:var(--brand-cream)]"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => { if (!zoomed) { setLightbox(false); setZoomed(false); } }}
        >
          {/* Close button */}
          <button
            onClick={() => { setLightbox(false); setZoomed(false); }}
            className="absolute top-4 right-4 z-10 inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/25 text-white transition"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Zoom toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z); }}
            className="absolute top-4 right-16 z-10 inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/25 text-white transition"
            aria-label={zoomed ? "Zoom out" : "Zoom in"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              {zoomed
                ? <path d="M15.5 15.5L20 20M10 17a7 7 0 110-14 7 7 0 010 14zM7 10h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                : <path d="M15.5 15.5L20 20M10 17a7 7 0 110-14 7 7 0 010 14zM10 7v6M7 10h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              }
            </svg>
          </button>

          {/* Prev arrow */}
          {safe.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 z-10 inline-flex items-center justify-center h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 text-white transition"
              aria-label="Previous image"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Next arrow */}
          {safe.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 z-10 inline-flex items-center justify-center h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 text-white transition"
              aria-label="Next image"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Main lightbox image */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative transition-all duration-300 ${
              zoomed
                ? "w-[95vw] h-[95vh] cursor-zoom-out overflow-auto"
                : "w-[90vw] h-[90vh] max-w-4xl cursor-zoom-in"
            }`}
          >
            <Image
              src={safe[active]}
              alt={alt}
              fill={!zoomed}
              width={zoomed ? 1600 : undefined}
              height={zoomed ? 1600 : undefined}
              sizes="95vw"
              className={zoomed ? "w-full h-auto" : "object-contain"}
              unoptimized
              priority
            />
          </div>

          {/* Dot indicators */}
          {safe.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
              {safe.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setActive(i); setZoomed(false); }}
                  aria-label={`Go to image ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === active ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
