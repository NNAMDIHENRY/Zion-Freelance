import "server-only";

import { prisma } from "@/lib/db";

export const MARKETPLACE_CATEGORY_SEED = [
  { slug: "web-development", name: "Web development", description: "Websites, web apps, APIs" },
  { slug: "mobile-development", name: "Mobile development", description: "iOS, Android, cross-platform" },
  { slug: "design-creative", name: "Design & creative", description: "UI/UX, branding, graphics" },
  { slug: "writing-content", name: "Writing & content", description: "Copy, blogs, technical writing" },
  { slug: "marketing-growth", name: "Marketing & growth", description: "SEO, ads, social, analytics" },
  { slug: "data-ai", name: "Data & AI", description: "Analytics, ML, automation" },
  { slug: "devops-cloud", name: "DevOps & cloud", description: "CI/CD, infra, reliability" },
  { slug: "business-support", name: "Business & support", description: "VA, ops, consulting" }
] as const;

export const MARKETPLACE_SKILL_SEED = [
  { slug: "typescript", name: "TypeScript" },
  { slug: "javascript", name: "JavaScript" },
  { slug: "react", name: "React" },
  { slug: "nextjs", name: "Next.js" },
  { slug: "nodejs", name: "Node.js" },
  { slug: "postgresql", name: "PostgreSQL" },
  { slug: "prisma", name: "Prisma" },
  { slug: "tailwind-css", name: "Tailwind CSS" },
  { slug: "figma", name: "Figma" },
  { slug: "ui-ux", name: "UI/UX design" },
  { slug: "content-writing", name: "Content writing" },
  { slug: "seo", name: "SEO" },
  { slug: "python", name: "Python" },
  { slug: "docker", name: "Docker" },
  { slug: "aws", name: "AWS" },
  { slug: "flutter", name: "Flutter" },
  { slug: "swift", name: "Swift" },
  { slug: "kotlin", name: "Kotlin" }
] as const;

export async function syncMarketplaceTaxonomy() {
  for (const c of MARKETPLACE_CATEGORY_SEED) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: { name: c.name, slug: c.slug, description: c.description },
      update: { name: c.name, description: c.description }
    });
  }
  for (const s of MARKETPLACE_SKILL_SEED) {
    await prisma.skill.upsert({
      where: { slug: s.slug },
      create: { name: s.name, slug: s.slug },
      update: { name: s.name }
    });
  }
}
