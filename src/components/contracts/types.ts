import type { ContractStatus, EscrowStatus, MilestoneStatus, ProjectStatus } from "@prisma/client";

export type ContractListItemDTO = {
  id: string;
  status: ContractStatus;
  projectId: string;
  projectTitle: string;
  agreedAmount: string;
  currency: string;
  createdAt: string;
  freelancerName: string;
  milestoneCount: number;
  completionPercent: number;
  escrowStatus: EscrowStatus | null;
  fundedAmount: string;
  releasedAmount: string;
};

export type ContractMilestoneDTO = {
  id: string;
  title: string;
  description: string | null;
  amount: string;
  currency: string;
  dueDate: string | null;
  status: MilestoneStatus;
  sortOrder: number;
  submittedAt: string | null;
  approvedAt: string | null;
  releasedAt: string | null;
};

export type ContractDetailDTO = {
  id: string;
  status: ContractStatus;
  agreedAmount: string;
  currency: string;
  deliveryDays: number | null;
  deliveryTerms: string | null;
  createdAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  completionNote: string | null;
  project: { id: string; title: string; status: ProjectStatus };
  client: { userId: string; name: string; email: string };
  freelancer: { userId: string; name: string; email: string };
  viewerRole: "client" | "freelancer";
  escrow: {
    status: EscrowStatus;
    fundedAmount: string;
    releasedAmount: string;
    pendingAmount: string;
    heldAmount: string;
    currency: string;
  } | null;
  milestones: ContractMilestoneDTO[];
  completionPercent: number;
};
