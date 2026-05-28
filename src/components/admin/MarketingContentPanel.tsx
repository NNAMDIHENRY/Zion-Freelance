"use client";

import type { PlatformBanner, PlatformPopup } from "@prisma/client";
import { ImageIcon, Loader2, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { toast } from "sonner";

import { FormTextArea, FormTextInput } from "@/components/dashboard/ui/Form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deletePlatformBannerAction,
  deletePlatformPopupAction,
  savePlatformBannerAction,
  savePlatformPopupAction
} from "@/lib/admin/marketing/actions";

function emptyPopup(): Partial<PlatformPopup> {
  return { title: "", body: "", ctaText: "", ctaUrl: "", imageFileId: "", enabled: false };
}

function emptyBanner(): Partial<PlatformBanner> {
  return { title: "", body: "", ctaText: "", ctaUrl: "", imageFileId: "", sortOrder: 0, enabled: false };
}

interface MarketingImageUploadProps {
  label: string;
  fileId: string;
  onUploaded: (fileId: string, previewUrl: string) => void;
  onRemove: () => void;
  previewUrl: string;
  error?: string;
}

function MarketingImageUpload({
  label,
  fileId,
  onUploaded,
  onRemove,
  previewUrl,
  error
}: MarketingImageUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/marketing/upload", {
        method: "POST",
        body: fd,
        credentials: "include"
      });
      const json = (await res.json()) as { ok?: boolean; id?: string; url?: string; error?: string };
      if (!res.ok || !json.ok || !json.id || !json.url) {
        toast.error(json.error ?? "Upload failed");
        return;
      }
      onUploaded(json.id, json.url);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  }

  const hasImage = Boolean(fileId && previewUrl);

  return (
    <div className="space-y-1">
      <span className="text-sm font-medium leading-none">{label}</span>
      {hasImage ? (
        <div className="relative w-full overflow-hidden rounded-lg border bg-muted" style={{ maxHeight: 180 }}>
          <Image
            src={previewUrl}
            alt="Preview"
            width={640}
            height={180}
            className="w-full object-cover"
            unoptimized
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/40 px-4 py-6 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4" />
              Click to upload image (JPEG, PNG, WebP, GIF · max 5 MB)
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleChange}
        disabled={uploading}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function MarketingContentPanel({
  popups,
  banners
}: {
  popups: PlatformPopup[];
  banners: PlatformBanner[];
}) {
  const [popupForm, setPopupForm] = React.useState(emptyPopup());
  const [popupPreviewUrl, setPopupPreviewUrl] = React.useState("");
  const [bannerForm, setBannerForm] = React.useState(emptyBanner());
  const [bannerPreviewUrl, setBannerPreviewUrl] = React.useState("");
  const [popupErrors, setPopupErrors] = React.useState<Record<string, string[]>>({});
  const [bannerErrors, setBannerErrors] = React.useState<Record<string, string[]>>({});
  const [pending, setPending] = React.useState<string | null>(null);

  function loadPopupForEdit(p: PlatformPopup) {
    setPopupForm(p);
    setPopupPreviewUrl(p.imageFileId ? `/api/uploads/${p.imageFileId}` : "");
  }

  function loadBannerForEdit(b: PlatformBanner) {
    setBannerForm(b);
    setBannerPreviewUrl(b.imageFileId ? `/api/uploads/${b.imageFileId}` : "");
  }

  async function savePopup(e: React.FormEvent) {
    e.preventDefault();
    setPopupErrors({});
    setPending("popup");
    const r = await savePlatformPopupAction({
      id: popupForm.id,
      title: popupForm.title ?? "",
      body: popupForm.body ?? "",
      ctaText: popupForm.ctaText ?? "",
      ctaUrl: popupForm.ctaUrl ?? "",
      imageFileId: popupForm.imageFileId ?? "",
      enabled: !!popupForm.enabled
    });
    setPending(null);
    if (!r.ok) {
      if (r.fieldErrors) setPopupErrors(r.fieldErrors);
      toast.error(r.error);
      return;
    }
    toast.success("Popup saved");
    setPopupForm(emptyPopup());
    setPopupPreviewUrl("");
  }

  async function saveBanner(e: React.FormEvent) {
    e.preventDefault();
    setBannerErrors({});
    setPending("banner");
    const r = await savePlatformBannerAction({
      id: bannerForm.id,
      title: bannerForm.title ?? "",
      body: bannerForm.body ?? "",
      ctaText: bannerForm.ctaText ?? "",
      ctaUrl: bannerForm.ctaUrl ?? "",
      imageFileId: bannerForm.imageFileId ?? "",
      sortOrder: bannerForm.sortOrder ?? 0,
      enabled: !!bannerForm.enabled
    });
    setPending(null);
    if (!r.ok) {
      if (r.fieldErrors) setBannerErrors(r.fieldErrors);
      toast.error(r.error);
      return;
    }
    toast.success("Banner saved");
    setBannerForm(emptyBanner());
    setBannerPreviewUrl("");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Update popups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={savePopup}>
            <FormTextInput
              label="Title"
              value={popupForm.title ?? ""}
              onChange={(e) => setPopupForm((p) => ({ ...p, title: e.target.value }))}
              error={popupErrors.title?.[0]}
              required
            />
            <FormTextArea
              label="Body"
              value={popupForm.body ?? ""}
              onChange={(e) => setPopupForm((p) => ({ ...p, body: e.target.value }))}
              error={popupErrors.body?.[0]}
              required
            />
            <FormTextInput
              label="CTA text"
              value={popupForm.ctaText ?? ""}
              onChange={(e) => setPopupForm((p) => ({ ...p, ctaText: e.target.value }))}
              error={popupErrors.ctaText?.[0]}
            />
            <FormTextInput
              label="CTA URL"
              value={popupForm.ctaUrl ?? ""}
              onChange={(e) => setPopupForm((p) => ({ ...p, ctaUrl: e.target.value }))}
              error={popupErrors.ctaUrl?.[0]}
            />
            <MarketingImageUpload
              label="Popup image (optional)"
              fileId={popupForm.imageFileId ?? ""}
              previewUrl={popupPreviewUrl}
              onUploaded={(id, url) => {
                setPopupForm((p) => ({ ...p, imageFileId: id }));
                setPopupPreviewUrl(url);
              }}
              onRemove={() => {
                setPopupForm((p) => ({ ...p, imageFileId: "" }));
                setPopupPreviewUrl("");
              }}
              error={popupErrors.imageFileId?.[0]}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!popupForm.enabled}
                onChange={(e) => setPopupForm((p) => ({ ...p, enabled: e.target.checked }))}
              />
              Active (only one should be enabled; republish bumps version)
            </label>
            <Button type="submit" disabled={pending === "popup"}>
              {popupForm.id ? "Update popup" : "Create popup"}
            </Button>
          </form>
          <ul className="space-y-2 border-t pt-4 text-sm">
            {popups.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2">
                <span>
                  {p.title} · v{p.version} · {p.enabled ? "on" : "off"}
                </span>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => loadPopupForEdit(p)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => void deletePlatformPopupAction(p.id).then(() => toast.success("Deleted"))}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Homepage banners</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={saveBanner}>
            <FormTextInput
              label="Title"
              value={bannerForm.title ?? ""}
              onChange={(e) => setBannerForm((p) => ({ ...p, title: e.target.value }))}
              error={bannerErrors.title?.[0]}
              required
            />
            <FormTextArea
              label="Subtitle / body"
              value={bannerForm.body ?? ""}
              onChange={(e) => setBannerForm((p) => ({ ...p, body: e.target.value }))}
              error={bannerErrors.body?.[0]}
              required
            />
            <FormTextInput
              label="CTA text"
              value={bannerForm.ctaText ?? ""}
              onChange={(e) => setBannerForm((p) => ({ ...p, ctaText: e.target.value }))}
              error={bannerErrors.ctaText?.[0]}
            />
            <FormTextInput
              label="CTA URL"
              value={bannerForm.ctaUrl ?? ""}
              onChange={(e) => setBannerForm((p) => ({ ...p, ctaUrl: e.target.value }))}
              error={bannerErrors.ctaUrl?.[0]}
            />
            <MarketingImageUpload
              label="Banner image (optional)"
              fileId={bannerForm.imageFileId ?? ""}
              previewUrl={bannerPreviewUrl}
              onUploaded={(id, url) => {
                setBannerForm((p) => ({ ...p, imageFileId: id }));
                setBannerPreviewUrl(url);
              }}
              onRemove={() => {
                setBannerForm((p) => ({ ...p, imageFileId: "" }));
                setBannerPreviewUrl("");
              }}
              error={bannerErrors.imageFileId?.[0]}
            />
            <FormTextInput
              label="Sort order"
              type="number"
              value={String(bannerForm.sortOrder ?? 0)}
              onChange={(e) =>
                setBannerForm((p) => ({ ...p, sortOrder: Number(e.target.value) || 0 }))
              }
              error={bannerErrors.sortOrder?.[0]}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!bannerForm.enabled}
                onChange={(e) => setBannerForm((p) => ({ ...p, enabled: e.target.checked }))}
              />
              Active
            </label>
            <Button type="submit" disabled={pending === "banner"}>
              {bannerForm.id ? "Update banner" : "Create banner"}
            </Button>
          </form>
          <ul className="space-y-2 border-t pt-4 text-sm">
            {banners.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2">
                <span>
                  {b.title} · order {b.sortOrder} · {b.enabled ? "on" : "off"}
                </span>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => loadBannerForEdit(b)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => void deletePlatformBannerAction(b.id).then(() => toast.success("Deleted"))}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
