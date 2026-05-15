"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  page?: number;
  pageSize?: number;
  totalRows?: number;
  onPageChange?: (page: number) => void;
  className?: string;
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  loading,
  emptyMessage = "No rows to display yet.",
  page = 1,
  pageSize,
  totalRows,
  onPageChange,
  className
}: DataTableProps<T>) {
  const showPagination = typeof pageSize === "number" && typeof totalRows === "number" && onPageChange;
  const totalPages =
    showPagination && pageSize! > 0 ? Math.max(1, Math.ceil(totalRows! / pageSize!)) : 1;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-subtle",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className="border-b border-border/40 last:border-0 hover:bg-muted/20"
                >
                  {columns.map((col) => (
                    <td key={col.id} className={cn("px-4 py-3 align-middle", col.className)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages}
            {typeof totalRows === "number" ? ` · ${totalRows} total` : null}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => onPageChange!(page - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-40"
              disabled={page >= totalPages}
              onClick={() => onPageChange!(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
