"use client";

import type { ReactNode } from "react";

import { ProposalStatus } from "@prisma/client";
import Link from "next/link";

import { DataTable, type DataTableColumn } from "@/components/dashboard/ui/DataTable";
import { OpenConversationButton } from "@/components/messaging/OpenConversationButton";
import { ProposalActions } from "@/components/proposals/ProposalActions";
import { ProposalStatusBadge } from "@/components/proposals/ProposalStatusBadge";
import type { ClientProposalRowDTO } from "@/components/proposals/types";
import { moneyLabel } from "@/lib/projects/formatting";

export function ClientProjectProposalsTable({
  rows,
  proposalDetailHref = (proposalId) => `/dashboard/proposals/${proposalId}`,
  actions = (row) => (
    <ProposalActions proposalId={row.id} status={row.status} role="client" />
  ),
  emptyMessage = "No proposals yet. Share your project link to attract talent."
}: {
  rows: ClientProposalRowDTO[];
  proposalDetailHref?: (proposalId: string) => string;
  actions?: (row: ClientProposalRowDTO) => ReactNode;
  emptyMessage?: string;
}) {
  const columns: DataTableColumn<ClientProposalRowDTO>[] = [
    {
      id: "freelancer",
      header: "Freelancer",
      cell: (row) => (
        <span className="font-medium">{row.freelancerName || row.freelancerEmail}</span>
      )
    },
    {
      id: "price",
      header: "Price",
      cell: (row) => (
        <span className="tabular-nums">{moneyLabel(row.proposedPrice, row.currency)}</span>
      )
    },
    {
      id: "delivery",
      header: "Delivery",
      cell: (row) => (
        <span>
          {row.deliveryDays != null ? `${row.deliveryDays} day${row.deliveryDays === 1 ? "" : "s"}` : "—"}
        </span>
      )
    },
    {
      id: "preview",
      header: "Cover letter",
      cell: (row) => (
        <p className="max-w-xs truncate text-muted-foreground">
          {row.coverLetter.replace(/\s+/g, " ").slice(0, 120)}
        </p>
      )
    },
    {
      id: "submitted",
      header: "Submitted",
      cell: (row) => (
        <span className="tabular-nums text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <ProposalStatusBadge status={row.status} />
    },
    {
      id: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href={proposalDetailHref(row.id)}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Open
          </Link>
          {row.status !== ProposalStatus.WITHDRAWN ? (
            <OpenConversationButton
              mode="proposal"
              proposalId={row.id}
              label="Message"
              variant="outline"
              size="sm"
            />
          ) : null}
          {actions(row)}
        </div>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowKey={(r) => r.id}
      emptyMessage={emptyMessage}
    />
  );
}
