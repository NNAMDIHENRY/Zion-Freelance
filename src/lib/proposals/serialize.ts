import type { FreelancerProposalListItem } from "@/lib/proposals/service";

import type { ClientProposalRowDTO, FreelancerProposalRowDTO } from "@/components/proposals/types";

export function serializeFreelancerProposalRow(row: FreelancerProposalListItem): FreelancerProposalRowDTO {
  return {
    id: row.id,
    projectId: row.project.id,
    projectTitle: row.project.title,
    proposedPrice: row.proposedPrice.toString(),
    currency: row.currency,
    deliveryDays: row.deliveryDays,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    coverLetter: row.coverLetter
  };
}

export function serializeClientProposalRow(row: FreelancerProposalListItem): ClientProposalRowDTO {
  const base = serializeFreelancerProposalRow(row);
  return {
    ...base,
    freelancerName: row.freelancer.user.name ?? "",
    freelancerEmail: row.freelancer.user.email
  };
}
