"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function PlatformPopup({
  popup
}: {
  popup: {
    id: string;
    title: string;
    body: string;
    ctaText: string | null;
    ctaUrl: string | null;
    imageFileId: string | null;
    version: number;
  };
}) {
  const [open, setOpen] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  if (!open) return null;

  async function dismiss() {
    setOpen(false);
    await fetch("/api/marketing/popup/dismiss", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ popupId: popup.id, version: popup.version })
    }).catch(() => undefined);
  }

  const imageUrl = popup.imageFileId ? `/api/uploads/${popup.imageFileId}` : null;
  const showImage = imageUrl && !imgFailed;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="platform-popup-title"
    >
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl animate-in zoom-in-95 duration-200">
        <div
          className={cn(
            "relative h-36 bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500",
            showImage && imgLoaded && "bg-transparent"
          )}
        >
          {showImage ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              className={cn("object-cover transition-opacity", imgLoaded ? "opacity-100" : "opacity-0")}
              unoptimized
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgFailed(true)}
            />
          ) : null}
        </div>
        <button
          type="button"
          className="absolute right-3 top-3 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/55"
          onClick={() => void dismiss()}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="space-y-3 p-6">
          <h2 id="platform-popup-title" className="text-lg font-semibold">
            {popup.title}
          </h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{popup.body}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {popup.ctaUrl ? (
              <a
                href={popup.ctaUrl}
                className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                {popup.ctaText ?? "Learn more"}
              </a>
            ) : null}
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-lg border px-4 text-sm"
              onClick={() => void dismiss()}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
