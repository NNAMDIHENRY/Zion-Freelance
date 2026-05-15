"use client";

import type { ReactNode } from "react";

import { ProposalStatus } from "@prisma/client";
import Link from "next/link";

import { DataTable, type DataTableColumn } from "@/components/dashboard/ui/DataTable";
import { ProposalStatusBadge } from "@/components/proposals/ProposalStatusBadge";
import type { FreelancerProposalRowDTO } from "@/components/proposals/types";
import { moneyLabel } from "@/lib/projects/formatting";

export function FreelancerProposalsTable({
  rows,
  loading,
  actions,
  emptyMessage = "You have not submitted any proposals yet."
}: {
  rows: FreelancerProposalRowDTO[];
  loading?: boolean;
  actions?: (row: FreelancerProposalRowDTO) => ReactNode;
  emptyMessage?: string;
}) {
  const columns: DataTableColumn<FreelancerProposalRowDTO>[] = [
    {
      id: "project",
      header: "Project",
      cell: (row) => (
        <Link
          href={`/dashboard/projects/${row.projectId}/proposal`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {row.projectTitle}
        </Link>
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
        <span>{row.deliveryDays != null ? `${row.deliveryDays}d` : "—"}</span>
      )
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <ProposalStatusBadge status={row.status} />
    },
    {
      id: "submitted",
      header: "Submitted",
      cell: (row) => (
        <span className="text-muted-foreground tabular-nums">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      )
    }
  ];

  if (actions) {
    columns.push({
      id: "actions",
      header: "",
      className: "text-right",
      cell: (row) => <div className="flex justify-end gap-2">{actions(row)}</div>
    });
  }

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowKey={(r) => r.id}
      loading={loading}
      emptyMessage={emptyMessage}
    />
  );
}
