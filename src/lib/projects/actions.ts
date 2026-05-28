"use server";

import "server-only";

import { Prisma, ProjectStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { projectWriteBaseSchema } from "@/lib/validators/project";

type ActionErr = { ok: false; error: string; fieldErrors?: Record<string, string[]> };
type ActionOk<T extends object = object> = { ok: true } & T;

async function getPrisma() {
  return (await import("@/lib/db")).prisma;
}

async function requireClientProfileId(): Promise<string | ActionErr> {
  const [{ getSession }, { getClientProfileIdForUser }] = await Promise.all([
    import("@/lib/auth/session"),
    import("@/lib/projects/service")
  ]);
  const session = await getSession();
  if (!session?.user || session.user.role !== Role.CLIENT) {
    return { ok: false, error: "Unauthorized" };
  }
  const clientId = await getClientProfileIdForUser(session.user.id);
  if (!clientId) return { ok: false, error: "Client profile missing" };
  return clientId;
}

function flattenZod(err: import("zod").ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const i of err.errors) {
    const k = i.path.join(".") || "_";
    out[k] = out[k] ?? [];
    out[k].push(i.message);
  }
  return out;
}

async function assertCategoryAndSkills(categoryId: string, skillIds: string[]) {
  const prisma = await getPrisma();
  const [cat, skills] = await Promise.all([
    prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } }),
    prisma.skill.findMany({ where: { id: { in: skillIds } }, select: { id: true } })
  ]);
  if (!cat) return false;
  return skills.length === skillIds.length;
}

export async function createProject(
  input: unknown
): Promise<ActionOk<{ id: string }> | ActionErr> {
  const clientId = await requireClientProfileId();
  if (typeof clientId !== "string") return clientId;

  const parsed = projectWriteBaseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: flattenZod(parsed.error) };
  }

  const d = parsed.data;
  const okRefs = await assertCategoryAndSkills(d.categoryId, d.skillIds);
  if (!okRefs) return { ok: false, error: "Invalid category or skills" };

  const budgetMin = new Prisma.Decimal(d.budgetMin);
  const budgetMax =
    d.budgetIsRange && d.budgetMax !== undefined ? new Prisma.Decimal(d.budgetMax) : null;

  const deadline = d.deadline ? new Date(d.deadline) : null;

  const prisma = await getPrisma();
  const project = await prisma.project.create({
    data: {
      title: d.title,
      description: d.description,
      status: d.status,
      budgetMin,
      budgetMax,
      deadline,
      currency: "USD",
      clientId,
      categoryId: d.categoryId,
      skills: {
        create: d.skillIds.map((skillId) => ({ skillId }))
      }
    },
    select: { id: true }
  });

  revalidatePath("/dashboard/projects");
  return { ok: true, id: project.id };
}

export async function updateProject(
  projectId: string,
  input: unknown
): Promise<ActionOk | ActionErr> {
  const clientId = await requireClientProfileId();
  if (typeof clientId !== "string") return clientId;

  const parsed = projectWriteBaseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: flattenZod(parsed.error) };
  }

  const prisma = await getPrisma();
  const existing = await prisma.project.findFirst({
    where: { id: projectId, clientId },
    select: { id: true }
  });
  if (!existing) return { ok: false, error: "Not found" };

  const d = parsed.data;
  const okRefs = await assertCategoryAndSkills(d.categoryId, d.skillIds);
  if (!okRefs) return { ok: false, error: "Invalid category or skills" };

  const budgetMin = new Prisma.Decimal(d.budgetMin);
  const budgetMax =
    d.budgetIsRange && d.budgetMax !== undefined ? new Prisma.Decimal(d.budgetMax) : null;

  const deadline = d.deadline ? new Date(d.deadline) : null;

  await prisma.$transaction([
    prisma.projectSkill.deleteMany({ where: { projectId } }),
    prisma.project.update({
      where: { id: projectId },
      data: {
        title: d.title,
        description: d.description,
        status: d.status,
        budgetMin,
        budgetMax,
        deadline,
        categoryId: d.categoryId,
        skills: {
          create: d.skillIds.map((skillId) => ({ skillId }))
        }
      }
    })
  ]);

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath(`/dashboard/projects/${projectId}/edit`);
  return { ok: true };
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus
): Promise<ActionOk | ActionErr> {
  const clientId = await requireClientProfileId();
  if (typeof clientId !== "string") return clientId;

  if (!Object.values(ProjectStatus).includes(status)) {
    return { ok: false, error: "Invalid status" };
  }

  const prisma = await getPrisma();
  const res = await prisma.project.updateMany({
    where: { id: projectId, clientId },
    data: { status }
  });
  if (res.count === 0) return { ok: false, error: "Not found" };

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { ok: true };
}

export async function deleteProject(projectId: string): Promise<ActionOk | ActionErr> {
  const clientId = await requireClientProfileId();
  if (typeof clientId !== "string") return clientId;

  const prisma = await getPrisma();
  const existing = await prisma.project.findFirst({
    where: { id: projectId, clientId },
    select: { status: true }
  });
  if (!existing) return { ok: false, error: "Not found" };
  if (existing.status === ProjectStatus.COMPLETED) {
    return { ok: false, error: "Completed projects cannot be deleted" };
  }

  const res = await prisma.project.deleteMany({
    where: { id: projectId, clientId }
  });
  if (res.count === 0) return { ok: false, error: "Not found" };

  revalidatePath("/dashboard/projects");
  return { ok: true };
}

export async function removeProjectAttachment(
  projectId: string,
  attachmentId: string
): Promise<ActionOk | ActionErr> {
  const clientId = await requireClientProfileId();
  if (typeof clientId !== "string") return clientId;

  const prisma = await getPrisma();
  const file = await prisma.fileUpload.findFirst({
    where: { id: attachmentId, projectId, project: { clientId } },
    select: { id: true }
  });
  if (!file) return { ok: false, error: "Not found" };

  await prisma.fileUpload.delete({ where: { id: attachmentId } });

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath(`/dashboard/projects/${projectId}/edit`);
  return { ok: true };
}
