import type { ProjectStatus } from "@prisma/client";

export type TaxonomyOption = { id: string; name: string; slug: string };

export type ProjectListRow = {
  id: string;
  title: string;
  category: string;
  statusDisplay: string;
  budget: string;
  deadline: string | null;
  updatedAt: string;
  attachmentCount: number;
};

export type ProjectFormInitial = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  skillIds: string[];
  budgetMin: string;
  budgetMax: string;
  budgetIsRange: boolean;
  deadline: string;
  status: ProjectStatus;
  attachments: { id: string; originalName: string; sizeBytes: number }[];
};
