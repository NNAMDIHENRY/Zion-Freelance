import "server-only";

const SLUG_RE = /[^a-z0-9]+/g;

export function slugifyJobTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(SLUG_RE, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "job";
}

export async function ensureUniqueJobSlug(
  base: string,
  excludeJobId?: string
): Promise<string> {
  const { prisma } = await import("@/lib/db");
  let slug = base;
  let n = 0;
  for (;;) {
    const existing = await prisma.job.findFirst({
      where: {
        slug,
        ...(excludeJobId ? { NOT: { id: excludeJobId } } : {})
      },
      select: { id: true }
    });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}
