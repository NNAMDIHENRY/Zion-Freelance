import "server-only";

import { prisma } from "@/lib/db";

export async function getJobAnalytics(jobId: string, posterId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, posterId },
    select: {
      id: true,
      title: true,
      viewCount: true,
      applicationCount: true,
      publishedAt: true
    }
  });
  if (!job) return null;

  const [statusBreakdown, recentApplicants] = await Promise.all([
    prisma.jobApplication.groupBy({
      by: ["status"],
      where: { jobId },
      _count: { id: true }
    }),
    prisma.jobApplication.findMany({
      where: { jobId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        createdAt: true
      }
    })
  ]);

  const views = job.viewCount;
  const applications = job.applicationCount;
  const conversionRate = views > 0 ? Math.round((applications / views) * 1000) / 10 : 0;

  return {
    job,
    views,
    applications,
    conversionRate,
    statusBreakdown,
    recentApplicants
  };
}
