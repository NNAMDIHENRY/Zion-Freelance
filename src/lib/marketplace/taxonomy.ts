import "server-only";

import { MARKETPLACE_CATEGORIES } from "@/lib/marketing/categories-data";
import { MARKETPLACE_SKILL_SEED } from "@/lib/marketplace/skills-seed";
import { prisma } from "@/lib/db";

export { MARKETPLACE_SKILL_SEED };

export const MARKETPLACE_CATEGORY_SEED = MARKETPLACE_CATEGORIES.map((c) => ({
  slug: c.slug,
  name: c.name,
  description: c.description
}));

export async function syncMarketplaceTaxonomy() {
  try {
    await syncMarketplaceTaxonomyInner();
  } catch (error) {
    console.error("[taxonomy] sync failed", error);
  }
}

async function syncMarketplaceTaxonomyInner() {
  for (const c of MARKETPLACE_CATEGORY_SEED) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: { name: c.name, slug: c.slug, description: c.description },
      update: { name: c.name, description: c.description }
    });
  }
  for (const s of MARKETPLACE_SKILL_SEED) {
    const bySlug = await prisma.skill.findUnique({ where: { slug: s.slug } });
    if (bySlug) {
      if (bySlug.name !== s.name) {
        const nameConflict = await prisma.skill.findFirst({
          where: { name: s.name, NOT: { id: bySlug.id } }
        });
        if (!nameConflict) {
          await prisma.skill.update({ where: { id: bySlug.id }, data: { name: s.name } });
        }
      }
      continue;
    }

    const byName = await prisma.skill.findFirst({ where: { name: s.name } });
    if (byName) {
      const slugFree = !(await prisma.skill.findFirst({
        where: { slug: s.slug, NOT: { id: byName.id } }
      }));
      if (slugFree) {
        await prisma.skill.update({
          where: { id: byName.id },
          data: { slug: s.slug, name: s.name }
        });
      }
      continue;
    }

    try {
      await prisma.skill.create({ data: { name: s.name, slug: s.slug } });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "P2002") continue;
      throw error;
    }
  }
}
