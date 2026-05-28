"use server";

import "server-only";

import {
  JobApplicationStatus,
  JobStatus,
  Prisma,
  Role
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireSessionUser, requireVerifiedPoster } from "@/lib/jobs/auth";
import { slugifyJobTitle, ensureUniqueJobSlug } from "@/lib/jobs/slug";
import {
  notifyJobApplicationStatus,
  notifyJobApplicationSubmitted,
  notifyJobModeration
} from "@/lib/jobs/workflow-events";
import {
  jobApplicationStatusSchema,
  jobApplicationWriteSchema,
  jobReportSchema,
  jobWriteSchema
} from "@/lib/validators/job";

type ActionErr = { ok: false; error: string; fieldErrors?: Record<string, string[]> };
type ActionOk<T extends object = object> = { ok: true } & T;

function flattenZod(err: import("zod").ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const i of err.errors) {
    const k = i.path.join(".") || "_";
    out[k] = out[k] ?? [];
    out[k].push(i.message);
  }
  return out;
}

async function getPrisma() {
  return (await import("@/lib/db")).prisma;
}

function parseMoney(v?: string) {
  if (!v || v === "") return null;
  return new Prisma.Decimal(v);
}

function jobDataFromInput(
  d: ReturnType<typeof jobWriteSchema.parse>,
  posterId: string,
  slug: string
): Prisma.JobCreateInput {
  const now = new Date();
  const publish =
    d.status === JobStatus.ACTIVE || d.status === JobStatus.PENDING
      ? { publishedAt: now }
      : {};
  return {
    title: d.title,
    slug,
    shortDescription: d.shortDescription,
    fullDescription: d.fullDescription,
    responsibilities: d.responsibilities || null,
    requirements: d.requirements || null,
    qualifications: d.qualifications || null,
    benefits: d.benefits || null,
    salaryMin: parseMoney(d.salaryMin),
    salaryMax: parseMoney(d.salaryMax),
    salaryType: d.salaryType ?? null,
    currency: d.currency,
    experienceLevel: d.experienceLevel,
    employmentType: d.employmentType,
    workMode: d.workMode,
    country: d.country || null,
    stateProvince: d.stateProvince || null,
    city: d.city || null,
    fullAddress: d.fullAddress || null,
    applicationUrl: d.applicationUrl || null,
    applicationEmail: d.applicationEmail || null,
    applicationDeadline: d.applicationDeadline ? new Date(d.applicationDeadline) : null,
    vacancies: d.vacancies,
    featured: d.featured ?? false,
    urgentHiring: d.urgentHiring ?? false,
    companyName: d.companyName,
    companyWebsite: d.companyWebsite || null,
    companySize: d.companySize || null,
    industry: d.industry || null,
    yearsInOperation: d.yearsInOperation ?? null,
    status: d.status === JobStatus.ACTIVE ? JobStatus.PENDING : d.status,
    expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
    poster: { connect: { id: posterId } },
    category: { connect: { id: d.categoryId } },
    skills: { create: d.skillIds.map((skillId) => ({ skillId })) },
    ...publish
  };
}

async function assertCategoryAndSkills(categoryId: string, skillIds: string[]) {
  const prisma = await getPrisma();
  const [cat, skills] = await Promise.all([
    prisma.jobCategory.findUnique({ where: { id: categoryId }, select: { id: true } }),
    prisma.skill.findMany({ where: { id: { in: skillIds } }, select: { id: true } })
  ]);
  return !!cat && skills.length === skillIds.length;
}

export async function createJob(input: unknown): Promise<ActionOk<{ id: string; slug: string }> | ActionErr> {
  const auth = await requireVerifiedPoster();
  if (!auth.ok) return auth;

  const parsed = jobWriteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: flattenZod(parsed.error) };
  }

  const d = parsed.data;
  if (!(await assertCategoryAndSkills(d.categoryId, d.skillIds))) {
    return { ok: false, error: "Invalid category or skills" };
  }

  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { verifiedAt: true }
  });

  const baseSlug = await ensureUniqueJobSlug(slugifyJobTitle(d.title));
  const job = await prisma.job.create({
    data: {
      ...jobDataFromInput(d, auth.userId, baseSlug),
      verifiedEmployerBadge: !!user?.verifiedAt
    },
    select: { id: true, slug: true }
  });

  revalidatePath("/dashboard/jobs");
  return { ok: true, id: job.id, slug: job.slug };
}

export async function updateJob(
  jobId: string,
  input: unknown
): Promise<ActionOk | ActionErr> {
  const auth = await requireVerifiedPoster();
  if (!auth.ok) return auth;

  const parsed = jobWriteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: flattenZod(parsed.error) };
  }

  const prisma = await getPrisma();
  const existing = await prisma.job.findFirst({
    where: { id: jobId, posterId: auth.userId },
    select: { id: true, slug: true, title: true }
  });
  if (!existing) return { ok: false, error: "Not found" };

  const d = parsed.data;
  if (!(await assertCategoryAndSkills(d.categoryId, d.skillIds))) {
    return { ok: false, error: "Invalid category or skills" };
  }

  let slug = existing.slug;
  if (slugifyJobTitle(d.title) !== slugifyJobTitle(existing.title)) {
    slug = await ensureUniqueJobSlug(slugifyJobTitle(d.title), jobId);
  }

  const nextStatus = d.status === JobStatus.ACTIVE ? JobStatus.PENDING : d.status;

  await prisma.$transaction([
    prisma.jobSkill.deleteMany({ where: { jobId } }),
    prisma.job.update({
      where: { id: jobId },
      data: {
        title: d.title,
        slug,
        shortDescription: d.shortDescription,
        fullDescription: d.fullDescription,
        responsibilities: d.responsibilities || null,
        requirements: d.requirements || null,
        qualifications: d.qualifications || null,
        benefits: d.benefits || null,
        salaryMin: parseMoney(d.salaryMin),
        salaryMax: parseMoney(d.salaryMax),
        salaryType: d.salaryType ?? null,
        currency: d.currency,
        experienceLevel: d.experienceLevel,
        employmentType: d.employmentType,
        workMode: d.workMode,
        categoryId: d.categoryId,
        country: d.country || null,
        stateProvince: d.stateProvince || null,
        city: d.city || null,
        fullAddress: d.fullAddress || null,
        applicationUrl: d.applicationUrl || null,
        applicationEmail: d.applicationEmail || null,
        applicationDeadline: d.applicationDeadline ? new Date(d.applicationDeadline) : null,
        vacancies: d.vacancies,
        featured: d.featured ?? false,
        urgentHiring: d.urgentHiring ?? false,
        companyName: d.companyName,
        companyWebsite: d.companyWebsite || null,
        companySize: d.companySize || null,
        industry: d.industry || null,
        yearsInOperation: d.yearsInOperation ?? null,
        status: nextStatus,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
        skills: { create: d.skillIds.map((skillId) => ({ skillId })) },
        ...(nextStatus === JobStatus.PENDING ? { publishedAt: new Date() } : {})
      }
    })
  ]);

  revalidatePath("/dashboard/jobs");
  revalidatePath(`/jobs/${slug}`);
  return { ok: true };
}

export async function deleteJob(jobId: string): Promise<ActionOk | ActionErr> {
  const auth = await requireVerifiedPoster();
  if (!auth.ok) return auth;
  const prisma = await getPrisma();
  const job = await prisma.job.findFirst({
    where: { id: jobId, posterId: auth.userId },
    select: { id: true }
  });
  if (!job) return { ok: false, error: "Not found" };
  await prisma.job.delete({ where: { id: jobId } });
  revalidatePath("/dashboard/jobs");
  return { ok: true };
}

export async function closeJob(jobId: string): Promise<ActionOk | ActionErr> {
  const auth = await requireVerifiedPoster();
  if (!auth.ok) return auth;
  const prisma = await getPrisma();
  const updated = await prisma.job.updateMany({
    where: { id: jobId, posterId: auth.userId },
    data: { status: JobStatus.CLOSED }
  });
  if (!updated.count) return { ok: false, error: "Not found" };
  revalidatePath("/dashboard/jobs");
  return { ok: true };
}

export async function reopenJob(jobId: string): Promise<ActionOk | ActionErr> {
  const auth = await requireVerifiedPoster();
  if (!auth.ok) return auth;
  const prisma = await getPrisma();
  const updated = await prisma.job.updateMany({
    where: { id: jobId, posterId: auth.userId, status: JobStatus.CLOSED },
    data: { status: JobStatus.PENDING, publishedAt: new Date() }
  });
  if (!updated.count) return { ok: false, error: "Not found" };
  revalidatePath("/dashboard/jobs");
  return { ok: true };
}

export async function duplicateJob(jobId: string): Promise<ActionOk<{ id: string }> | ActionErr> {
  const auth = await requireVerifiedPoster();
  if (!auth.ok) return auth;
  const prisma = await getPrisma();
  const src = await prisma.job.findFirst({
    where: { id: jobId, posterId: auth.userId },
    include: { skills: true }
  });
  if (!src) return { ok: false, error: "Not found" };

  const slug = await ensureUniqueJobSlug(`${src.slug}-copy`);
  const copy = await prisma.job.create({
    data: {
      title: `${src.title} (copy)`,
      slug,
      shortDescription: src.shortDescription,
      fullDescription: src.fullDescription,
      responsibilities: src.responsibilities,
      requirements: src.requirements,
      qualifications: src.qualifications,
      benefits: src.benefits,
      salaryMin: src.salaryMin,
      salaryMax: src.salaryMax,
      salaryType: src.salaryType,
      currency: src.currency,
      experienceLevel: src.experienceLevel,
      employmentType: src.employmentType,
      workMode: src.workMode,
      categoryId: src.categoryId,
      country: src.country,
      stateProvince: src.stateProvince,
      city: src.city,
      fullAddress: src.fullAddress,
      applicationUrl: src.applicationUrl,
      applicationEmail: src.applicationEmail,
      applicationDeadline: src.applicationDeadline,
      vacancies: src.vacancies,
      companyName: src.companyName,
      companyWebsite: src.companyWebsite,
      companySize: src.companySize,
      industry: src.industry,
      yearsInOperation: src.yearsInOperation,
      verifiedEmployerBadge: src.verifiedEmployerBadge,
      status: JobStatus.DRAFT,
      posterId: auth.userId,
      skills: { create: src.skills.map((s) => ({ skillId: s.skillId })) }
    },
    select: { id: true }
  });

  revalidatePath("/dashboard/jobs");
  return { ok: true, id: copy.id };
}

export async function toggleSaveJob(jobId: string): Promise<ActionOk<{ saved: boolean }> | ActionErr> {
  const auth = await requireSessionUser();
  if (!auth.ok) return auth;
  const prisma = await getPrisma();
  const job = await prisma.job.findFirst({
    where: { id: jobId, status: JobStatus.ACTIVE },
    select: { id: true }
  });
  if (!job) return { ok: false, error: "Job not available" };

  const existing = await prisma.savedJob.findUnique({
    where: { userId_jobId: { userId: auth.userId, jobId } }
  });
  if (existing) {
    await prisma.savedJob.delete({ where: { id: existing.id } });
    revalidatePath("/dashboard/jobs/saved");
    return { ok: true, saved: false };
  }
  await prisma.savedJob.create({ data: { userId: auth.userId, jobId } });
  revalidatePath("/dashboard/jobs/saved");
  return { ok: true, saved: true };
}

export async function submitJobApplication(
  input: unknown
): Promise<ActionOk<{ applicationId: string }> | ActionErr> {
  const auth = await requireSessionUser();
  if (!auth.ok) return auth;

  const { rateLimit } = await import("@/lib/rate-limit");
  const rl = rateLimit(`job-apply:${auth.userId}`, 5, 60 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: "Too many applications. Try again later." };

  const parsed = jobApplicationWriteSchema.safeParse(input);
  if (!parsed.success) {
    console.log(parsed.error.flatten());
    return { ok: false, error: "Validation failed", fieldErrors: flattenZod(parsed.error) };
  }

  const prisma = await getPrisma();
  const d = parsed.data;
  const job = await prisma.job.findFirst({
    where: { id: d.jobId, status: JobStatus.ACTIVE },
    include: { poster: { select: { id: true, name: true } } }
  });
  if (!job) return { ok: false, error: "Job not open" };
  if (job.posterId === auth.userId) return { ok: false, error: "Cannot apply to your own job" };
  if (job.applicationDeadline && job.applicationDeadline < new Date()) {
    return { ok: false, error: "Application deadline has passed" };
  }

  const dup = await prisma.jobApplication.findUnique({
    where: { jobId_applicantId: { jobId: d.jobId, applicantId: auth.userId } }
  });
  if (dup && dup.status !== JobApplicationStatus.WITHDRAWN) {
    return { ok: false, error: "You already applied to this job" };
  }

  const app = await prisma.$transaction(async (tx) => {
    if (dup) {
      const updated = await tx.jobApplication.update({
        where: { id: dup.id },
        data: {
          fullName: d.fullName,
          email: d.email,
          phone: d.phone || null,
          coverLetter: d.coverLetter,
          portfolioUrl: d.portfolioUrl || null,
          linkedInUrl: d.linkedInUrl || null,
          githubUrl: d.githubUrl || null,
          yearsExperience: d.yearsExperience ?? null,
          availability: d.availability || null,
          expectedSalary: parseMoney(d.expectedSalary),
          expectedSalaryType: d.expectedSalaryType ?? null,
          currency: d.currency,
          status: JobApplicationStatus.PENDING,
          withdrawnAt: null
        }
      });
      return updated;
    }
    const created = await tx.jobApplication.create({
      data: {
        jobId: d.jobId,
        applicantId: auth.userId,
        fullName: d.fullName,
        email: d.email,
        phone: d.phone || null,
        coverLetter: d.coverLetter,
        portfolioUrl: d.portfolioUrl || null,
        linkedInUrl: d.linkedInUrl || null,
        githubUrl: d.githubUrl || null,
        yearsExperience: d.yearsExperience ?? null,
        availability: d.availability || null,
        expectedSalary: parseMoney(d.expectedSalary),
        expectedSalaryType: d.expectedSalaryType ?? null,
        currency: d.currency
      }
    });
    await tx.job.update({
      where: { id: d.jobId },
      data: { applicationCount: { increment: 1 } }
    });
    return created;
  });

  const applicant = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { name: true }
  });

  await notifyJobApplicationSubmitted({
    posterUserId: job.posterId,
    jobId: job.id,
    jobTitle: job.title,
    applicationId: app.id,
    applicantName: applicant?.name ?? d.fullName
  });

  revalidatePath(`/jobs/${job.slug}`);
  revalidatePath("/dashboard/jobs/applications");
  return { ok: true, applicationId: app.id };
}

export async function withdrawJobApplication(applicationId: string): Promise<ActionOk | ActionErr> {
  const auth = await requireSessionUser();
  if (!auth.ok) return auth;
  const prisma = await getPrisma();
  const app = await prisma.jobApplication.findFirst({
    where: { id: applicationId, applicantId: auth.userId },
    select: { id: true, status: true, jobId: true }
  });
  if (!app) return { ok: false, error: "Not found" };
  if (app.status === JobApplicationStatus.WITHDRAWN) return { ok: true };

  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: JobApplicationStatus.WITHDRAWN, withdrawnAt: new Date() }
  });
  revalidatePath("/dashboard/jobs/applications");
  return { ok: true };
}

const STATUS_LABELS: Record<JobApplicationStatus, string> = {
  PENDING: "Pending",
  REVIEWING: "Under review",
  SHORTLISTED: "Shortlisted",
  INTERVIEWED: "Interviewed",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn"
};

export async function updateApplicationStatus(
  input: unknown
): Promise<ActionOk | ActionErr> {
  const auth = await requireVerifiedPoster();
  if (!auth.ok) return auth;

  const parsed = jobApplicationStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: flattenZod(parsed.error) };
  }

  const prisma = await getPrisma();
  const app = await prisma.jobApplication.findUnique({
    where: { id: parsed.data.applicationId },
    include: { job: { select: { posterId: true, title: true } } }
  });
  if (!app || app.job.posterId !== auth.userId) return { ok: false, error: "Not found" };

  await prisma.jobApplication.update({
    where: { id: parsed.data.applicationId },
    data: {
      status: parsed.data.status,
      reviewedAt: new Date()
    }
  });

  await notifyJobApplicationStatus({
    applicantUserId: app.applicantId,
    jobTitle: app.job.title,
    applicationId: app.id,
    statusLabel: STATUS_LABELS[parsed.data.status]
  });

  revalidatePath(`/dashboard/jobs/${app.jobId}/applications`);
  return { ok: true };
}

export async function reportJob(input: unknown): Promise<ActionOk | ActionErr> {
  const auth = await requireSessionUser();
  if (!auth.ok) return auth;
  const parsed = jobReportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: flattenZod(parsed.error) };
  }
  const prisma = await getPrisma();
  const existing = await prisma.jobReport.findFirst({
    where: { jobId: parsed.data.jobId, reporterId: auth.userId, status: "OPEN" }
  });
  if (existing) return { ok: false, error: "You already reported this job" };

  await prisma.jobReport.create({
    data: {
      jobId: parsed.data.jobId,
      reporterId: auth.userId,
      reason: parsed.data.reason,
      details: parsed.data.details || null
    }
  });
  return { ok: true };
}

export async function adminModerateJob(
  input: unknown
): Promise<ActionOk | ActionErr> {
  const { getSession } = await import("@/lib/auth/session");
  const session = await getSession();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return { ok: false, error: "Unauthorized" };
  }

  const { adminJobModerationSchema } = await import("@/lib/validators/job");
  const parsed = adminJobModerationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: flattenZod(parsed.error) };
  }

  const prisma = await getPrisma();
  const job = await prisma.job.findUnique({
    where: { id: parsed.data.jobId },
    select: { id: true, title: true, posterId: true, slug: true }
  });
  if (!job) return { ok: false, error: "Not found" };

  await prisma.job.update({
    where: { id: parsed.data.jobId },
    data: {
      status: parsed.data.status,
      moderationNote: parsed.data.moderationNote || null,
      moderatedAt: new Date(),
      featured: parsed.data.featured ?? undefined,
      ...(parsed.data.status === JobStatus.ACTIVE ? { publishedAt: new Date() } : {})
    }
  });

  await notifyJobModeration({
    posterUserId: job.posterId,
    jobId: job.id,
    jobTitle: job.title,
    approved: parsed.data.status === JobStatus.ACTIVE,
    note: parsed.data.moderationNote
  });

  revalidatePath("/admin/jobs");
  revalidatePath(`/jobs/${job.slug}`);
  return { ok: true };
}
