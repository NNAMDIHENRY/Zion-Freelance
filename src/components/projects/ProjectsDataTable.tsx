"use client";

import Link from "next/link";
import * as React from "react";

import { DataTable } from "@/components/dashboard/ui/DataTable";

import { ProjectListRowActions } from "./ProjectListRowActions";
import type { ProjectListRow } from "./project-types";

export function ProjectsDataTable({ rows }: { rows: ProjectListRow[] }) {
  const columns = React.useMemo(
    () => [
      {
        id: "title",
        header: "Project",
        cell: (row: ProjectListRow) => (
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/dashboard/projects/${row.id}`}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {row.title}
            </Link>
            <span className="text-xs text-muted-foreground">{row.category}</span>
          </div>
        )
      },
      {
        id: "status",
        header: "Status",
        cell: (row: ProjectListRow) => (
          <span className="rounded-full bg-muted/80 px-2 py-0.5 text-xs font-medium">{row.statusDisplay}</span>
        )
      },
      {
        id: "budget",
        header: "Budget",
        cell: (row: ProjectListRow) => <span className="tabular-nums">{row.budget}</span>
      },
      {
        id: "deadline",
        header: "Deadline",
        cell: (row: ProjectListRow) => (
          <span className="text-muted-foreground">
            {row.deadline ? new Date(row.deadline).toLocaleDateString() : "—"}
          </span>
        )
      },
      {
        id: "files",
        header: "Files",
        className: "w-16 text-center",
        cell: (row: ProjectListRow) => <span className="tabular-nums">{row.attachmentCount}</span>
      },
      {
        id: "actions",
        header: "",
        className: "w-14 text-right",
        cell: (row: ProjectListRow) => <ProjectListRowActions projectId={row.id} />
      }
    ],
    []
  );

  return <DataTable columns={columns} data={rows} getRowKey={(r) => r.id} emptyMessage="No projects yet." />;
}
