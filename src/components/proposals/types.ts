import type { ProposalStatus } from "@prisma/client";

/** JSON-safe row for client tables (Dates as ISO strings, decimals as strings). */
export type FreelancerProposalRowDTO = {
  id: string;
  projectId: string;
  projectTitle: string;
  proposedPrice: string;
  currency: string;
  deliveryDays: number | null;
  status: ProposalStatus;
  createdAt: string;
  coverLetter: string;
};

export type ClientProposalRowDTO = FreelancerProposalRowDTO & {
  freelancerName: string;
  freelancerEmail: string;
};
