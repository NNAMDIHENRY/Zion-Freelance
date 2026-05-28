import "server-only";

import { ProjectModerationStatus, ProjectStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { budgetLabel } from "@/lib/projects/formatting";

const PUBLIC_STATUSES: ProjectStatus[] = [
  ProjectStatus.OPEN,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.COMPLETED,
  ProjectStatus.CLOSED
];

export async function getPublicProject(id: string) {
  const project = await prisma.project.findFirst({
    where: {
      id,
      status: { in: PUBLIC_STATUSES },
      moderationStatus: ProjectModerationStatus.ACTIVE
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      skills: { include: { skill: { select: { id: true, name: true, slug: true } } } },
      client: {
        select: {
          companyName: true,
          user: { select: { id: true, name: true } }
        }
      },
      attachments: {
        orderBy: { createdAt: "desc" },
        select: { id: true, originalName: true, mimeType: true, sizeBytes: true }
      }
    }
  });

  if (!project) return null;

  return {
    id: project.id,
    status: project.status,
    title: project.title,
    description: project.description,
    budgetLabel: budgetLabel(project.budgetMin, project.budgetMax, project.currency),
    currency: project.currency,
    deadline: project.deadline,
    createdAt: project.createdAt,
    category: project.category,
    skills: project.skills.map((s) => s.skill),
    client: {
      userId: project.client.user.id,
      name: project.client.user.name,
      companyName: project.client.companyName
    },
    attachments: project.attachments
  };
}
