"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const MAX_IMAGES = 6;
const MAX_DIMENSION = 1024; // px — long edge after resize
const JPEG_QUALITY = 0.82;

type Props = {
  value: string[];
  onChange: (images: string[]) => void;
  label?: string;
};

/**
 * Multi-image uploader with mobile camera support.
 *
 * Images are converted to JPEG, resized client-side so the long edge is
 * <= MAX_DIMENSION, and stored as base64 data-URLs. This keeps localStorage
 * payloads small (~80-200 KB per photo instead of multi-MB raw uploads).
 *
 * Two pickers are provided:
 *   - "Choose photos"  → opens the file picker (gallery on mobile, file system on desktop)
 *   - "Take photo"     → triggers the rear camera on mobile, gracefully degrades on desktop
 */
export default function ImageUploader({ value, onChange, label = "Product photos" }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const remaining = MAX_IMAGES - value.length;
      if (remaining <= 0) {
        setError(`You can upload up to ${MAX_IMAGES} photos per product.`);
        return;
      }

      const list = Array.from(files).slice(0, remaining);
      const next: string[] = [];
      for (const f of list) {
        if (!f.type.startsWith("image/")) continue;
        try {
          const dataUrl = await fileToCompressedDataUrl(f);
          next.push(dataUrl);
        } catch {
          // Skip individual failures, keep going
        }
      }
      if (next.length === 0) {
        setError("Couldn't process those files. Try smaller images.");
      } else {
        onChange([...value, ...next]);
      }
    } finally {
      setBusy(false);
      // Reset inputs so picking the same file twice in a row re-triggers
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  }

  function removeAt(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function makePrimary(idx: number) {
    if (idx === 0) return;
    const next = [...value];
    const [picked] = next.splice(idx, 1);
    next.unshift(picked);
    onChange(next);
  }

  // Drag-to-reorder (desktop only — touch reordering is finicky for the MVP)
  function onDragStart(idx: number) {
    setDragIndex(idx);
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function onDrop(targetIdx: number) {
    if (dragIndex === null || dragIndex === targetIdx) {
      setDragIndex(null);
      return;
    }
    const next = [...value];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIdx, 0, moved);
    onChange(next);
    setDragIndex(null);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="block text-sm font-medium">{label}</span>
        <span className="text-xs text-[color:var(--muted)]">
          {value.length} / {MAX_IMAGES}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {value.map((src, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragOver={onDragOver}
            onDrop={() => onDrop(idx)}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 bg-[color:var(--brand-cream)] group transition ${
              idx === 0
                ? "border-[color:var(--brand-navy)]"
                : "border-[color:var(--border)] hover:border-[color:var(--brand-navy)]"
            }`}
            title="Drag to reorder"
          >
            {/* Using Image with the data URL works — Next.js Image accepts data URLs */}
            <Image
              src={src}
              alt={`Product photo ${idx + 1}`}
              fill
              sizes="160px"
              className="object-cover"
              unoptimized
            />
            {idx === 0 && (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[color:var(--brand-navy)] text-white text-[9px] font-bold uppercase tracking-wider">
                Primary
              </span>
            )}
            <div className="absolute inset-0 flex items-end justify-between p-1.5 opacity-0 group-hover:opacity-100 transition bg-gradient-to-t from-black/70 to-transparent">
              {idx !== 0 && (
                <button
                  type="button"
                  onClick={() => makePrimary(idx)}
                  className="text-[10px] font-bold text-white bg-black/40 hover:bg-black/60 px-1.5 py-0.5 rounded"
                >
                  Set primary
                </button>
              )}
              <button
                type="button"
                onClick={() => removeAt(idx)}
                aria-label="Remove image"
                className="text-white bg-[color:var(--brand-clay)] hover:brightness-110 h-6 w-6 rounded inline-flex items-center justify-center text-sm font-bold ml-auto"
              >
                ×
              </button>
            </div>
          </div>
        ))}

        {value.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="aspect-square rounded-lg border-2 border-dashed border-[color:var(--border)] hover:border-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)] transition flex flex-col items-center justify-center gap-1 text-[color:var(--muted)] disabled:opacity-50"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-wider">Add</span>
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={busy || value.length >= MAX_IMAGES}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[color:var(--brand-navy)] text-white hover:bg-[color:var(--brand-navy-soft)] transition disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 7h4l2-3h6l2 3h4v13H3V7zM12 11a4 4 0 100 8 4 4 0 000-8z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          Take photo
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy || value.length >= MAX_IMAGES}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[color:var(--brand-navy)] text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)] transition disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Choose photos
        </button>
        {busy && <span className="text-xs text-[color:var(--muted)] italic self-center">Processing…</span>}
      </div>

      {error && <p className="mt-2 text-xs text-[color:var(--brand-clay)]">{error}</p>}
      <p className="mt-2 text-[10px] text-[color:var(--muted)]">
        Photos are resized to {MAX_DIMENSION}px and stored in your browser. Drag to reorder.
      </p>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        // capture attr asks the device for the rear camera on mobile.
        // On desktop browsers it's silently ignored and the file picker opens.
        capture="environment"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}

/**
 * Read a File, resize the longest edge to MAX_DIMENSION, and return a JPEG
 * data-URL at JPEG_QUALITY. Uses an offscreen <canvas>.
 */
async function fileToCompressedDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    // Older browsers — fall back to <img> + canvas
    return readWithImg(file);
  }
  const { width, height } = scaleSize(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

function readWithImg(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Image load failed"));
      img.onload = () => {
        const { width, height } = scaleSize(img.naturalWidth, img.naturalHeight);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No 2D context"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function scaleSize(w: number, h: number) {
  const long = Math.max(w, h);
  if (long <= MAX_DIMENSION) return { width: w, height: h };
  const ratio = MAX_DIMENSION / long;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}
