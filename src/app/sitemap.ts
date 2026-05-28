export const dynamic = "force-dynamic";
import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db";
import { siteOrigin } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteOrigin();
  const now = new Date();

  const staticRoutes = [
    "",
    "/freelancers",
    "/jobs",
    "/categories",
    "/search",
    "/pricing",
    "/about",
    "/contact",
    "/projects"
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7
  }));

  const [jobs, freelancers] = await Promise.all([
    prisma.job.findMany({
      where: { status: "ACTIVE", publishedAt: { not: null } },
      select: { slug: true, updatedAt: true },
      take: 5000,
      orderBy: { updatedAt: "desc" }
    }),
    prisma.user.findMany({
      where: {
        role: "FREELANCER",
        freelancerProfile: { is: { isPublic: true } }
      },
      select: { id: true, updatedAt: true },
      take: 5000,
      orderBy: { updatedAt: "desc" }
    })
  ]);

  const jobEntries: MetadataRoute.Sitemap = jobs.map((j) => ({
    url: `${base}/jobs/${j.slug}`,
    lastModified: j.updatedAt,
    changeFrequency: "daily",
    priority: 0.8
  }));

  const talentEntries: MetadataRoute.Sitemap = freelancers.map((u) => ({
    url: `${base}/users/${u.id}`,
    lastModified: u.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6
  }));

  return [...staticEntries, ...jobEntries, ...talentEntries];
}
