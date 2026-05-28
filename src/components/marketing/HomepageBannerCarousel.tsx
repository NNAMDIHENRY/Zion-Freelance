"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BannerSlide = {
  id: string;
  title: string;
  body: string;
  ctaText: string | null;
  ctaUrl: string | null;
  imageFileId: string | null;
};

export function HomepageBannerCarousel({ slides }: { slides: BannerSlide[] }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const [imgFailed, setImgFailed] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (collapsed || slides.length < 2) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(t);
  }, [collapsed, slides.length]);

  if (!slides.length) return null;

  const slide = slides[index]!;
  const imageUrl = slide.imageFileId ? `/api/uploads/${slide.imageFileId}` : null;

  return (
    <section
      className="border-b border-border/40 bg-gradient-to-r from-violet-600/10 via-background to-cyan-500/10"
      aria-label="Announcements"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-end py-1">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/60"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <>
                <ChevronDown className="h-3.5 w-3.5" /> Show
              </>
            ) : (
              <>
                <ChevronUp className="h-3.5 w-3.5" /> Hide
              </>
            )}
          </button>
        </div>
        {!collapsed ? (
          <div className="relative pb-4">
            <div className="flex min-h-[7rem] items-stretch gap-4 rounded-xl border border-violet-500/20 bg-card/60 p-3 shadow-sm backdrop-blur-sm sm:min-h-[6.5rem] sm:p-4">
              <div className="relative hidden w-24 shrink-0 overflow-hidden rounded-lg sm:block md:w-32">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500" />
                {imageUrl && !imgFailed[slide.id] ? (
                  <Image
                    src={imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => setImgFailed((p) => ({ ...p, [slide.id]: true }))}
                  />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                  Featured
                </p>
                <h2 className="text-base font-semibold sm:text-lg">{slide.title}</h2>
                <p className="line-clamp-2 text-sm text-muted-foreground">{slide.body}</p>
                {slide.ctaUrl ? (
                  <div className="mt-2">
                    <Button asChild size="sm" className="h-8 rounded-lg text-xs">
                      <Link href={slide.ctaUrl}>{slide.ctaText ?? "Learn more"}</Link>
                    </Button>
                  </div>
                ) : null}
              </div>
              {slides.length > 1 ? (
                <div className="flex shrink-0 flex-col justify-center gap-1">
                  <button
                    type="button"
                    className="rounded-md border bg-background p-1.5 shadow-sm"
                    aria-label="Previous slide"
                    onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-md border bg-background p-1.5 shadow-sm"
                    aria-label="Next slide"
                    onClick={() => setIndex((i) => (i + 1) % slides.length)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
            {slides.length > 1 ? (
              <div className="mt-2 flex justify-center gap-1.5">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === index ? "w-5 bg-violet-600" : "w-1.5 bg-muted-foreground/40"
                    )}
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => setIndex(i)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
