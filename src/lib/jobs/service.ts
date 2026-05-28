import "server-only";

import { JobStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function listJobCategories() {
  return prisma.jobCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true }
  });
}

export async function listJobTaxonomy() {
  const [categories, skills] = await Promise.all([
    listJobCategories(),
    prisma.skill.findMany({
      orderBy: { name: "asc" },
      take: 500,
      select: { id: true, name: true, slug: true }
    })
  ]);
  return { categories, skills };
}

export async function seedDefaultJobCategoriesIfEmpty() {
  const count = await prisma.jobCategory.count();
  if (count > 0) return;
  const defaults = [
    { name: "Technology", slug: "technology", sortOrder: 1 },
    { name: "Design", slug: "design", sortOrder: 2 },
    { name: "Marketing", slug: "marketing", sortOrder: 3 },
    { name: "Sales", slug: "sales", sortOrder: 4 },
    { name: "Finance", slug: "finance", sortOrder: 5 },
    { name: "Operations", slug: "operations", sortOrder: 6 },
    { name: "Customer Support", slug: "customer-support", sortOrder: 7 },
    { name: "Human Resources", slug: "human-resources", sortOrder: 8 }
  ];
  await prisma.jobCategory.createMany({ data: defaults });
}

export async function getJobBySlug(slug: string) {
  return prisma.job.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      poster: { select: { id: true, name: true, verifiedAt: true, imageFileId: true } },
      skills: { include: { skill: { select: { id: true, name: true, slug: true } } } },
      attachments: {
        select: { id: true, originalName: true, mimeType: true, sizeBytes: true }
      },
      _count: { select: { applications: true, savedBy: true } }
    }
  });
}

export async function getPosterJobs(userId: string, status?: JobStatus) {
  return prisma.job.findMany({
    where: { posterId: userId, ...(status ? { status } : {}) },
    orderBy: { updatedAt: "desc" },
    include: {
      category: { select: { name: true } },
      _count: { select: { applications: true, views: true } }
    }
  });
}

export async function isJobSaved(userId: string, jobId: string) {
  const row = await prisma.savedJob.findUnique({
    where: { userId_jobId: { userId, jobId } },
    select: { id: true }
  });
  return !!row;
}

export async function expireStaleJobs() {
  const now = new Date();
  await prisma.job.updateMany({
    where: {
      status: JobStatus.ACTIVE,
      expiresAt: { lt: now }
    },
    data: { status: JobStatus.EXPIRED }
  });
}
