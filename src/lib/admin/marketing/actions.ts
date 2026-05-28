"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/permissions";
import { prisma } from "@/lib/db";
import { platformBannerSchema, platformPopupSchema } from "@/lib/validators/admin";

type Result = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function flatten(err: import("zod").ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const i of err.errors) {
    const k = i.path.join(".") || "_";
    out[k] = out[k] ?? [];
    out[k].push(i.message);
  }
  return out;
}

const PATHS = ["/", "/admin/marketing"];

function revalidate() {
  for (const p of PATHS) revalidatePath(p);
}

export async function savePlatformPopupAction(raw: unknown): Promise<Result> {
  await requireAdmin();
  const parsed = platformPopupSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: flatten(parsed.error) };
  }
  const d = parsed.data;
  const data = {
    title: d.title,
    body: d.body,
    ctaText: d.ctaText || null,
    ctaUrl: d.ctaUrl || null,
    imageFileId: d.imageFileId || null,
    enabled: d.enabled
  };

  if (d.id) {
    const existing = await prisma.platformPopup.findUnique({ where: { id: d.id } });
    if (!existing) return { ok: false, error: "Popup not found" };
    const contentChanged =
      existing.title !== data.title ||
      existing.body !== data.body ||
      existing.ctaUrl !== data.ctaUrl ||
      existing.ctaText !== data.ctaText;
    await prisma.platformPopup.update({
      where: { id: d.id },
      data: {
        ...data,
        version:
          data.enabled && (contentChanged || (!existing.enabled && data.enabled))
            ? existing.version + 1
            : existing.version
      }
    });
  } else {
    await prisma.platformPopup.create({ data });
  }

  revalidate();
  return { ok: true };
}

export async function deletePlatformPopupAction(id: string): Promise<Result> {
  await requireAdmin();
  await prisma.platformPopup.delete({ where: { id } });
  revalidate();
  return { ok: true };
}

export async function savePlatformBannerAction(raw: unknown): Promise<Result> {
  await requireAdmin();
  const parsed = platformBannerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: flatten(parsed.error) };
  }
  const d = parsed.data;
  const data = {
    title: d.title,
    body: d.body,
    ctaText: d.ctaText || null,
    ctaUrl: d.ctaUrl || null,
    imageFileId: d.imageFileId || null,
    sortOrder: d.sortOrder,
    enabled: d.enabled
  };

  if (d.id) {
    await prisma.platformBanner.update({ where: { id: d.id }, data });
  } else {
    await prisma.platformBanner.create({ data });
  }

  revalidate();
  return { ok: true };
}

export async function deletePlatformBannerAction(id: string): Promise<Result> {
  await requireAdmin();
  await prisma.platformBanner.delete({ where: { id } });
  revalidate();
  return { ok: true };
}
