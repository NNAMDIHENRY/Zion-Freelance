"use client";

import * as React from "react";
import { PaymentStatus, TransactionType } from "@prisma/client";

import { TransactionStatusBadge } from "@/components/payments/TransactionStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTransactionHistoryAction } from "@/lib/payments/actions";
import { formatMoney } from "@/lib/payments/serialize";
import type { SerializedTransaction } from "@/lib/payments/types";
import { cn } from "@/lib/utils";

import { TransactionDetailModal } from "./TransactionDetailModal";

type TransactionTableProps = {
  currency: string;
  initialRows: SerializedTransaction[];
  initialTotal: number;
  roleFilterTypes?: TransactionType[];
};

export function TransactionTable({
  currency,
  initialRows,
  initialTotal,
  roleFilterTypes
}: TransactionTableProps) {
  const [rows, setRows] = React.useState(initialRows);
  const [total, setTotal] = React.useState(initialTotal);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState<TransactionType | "">("");
  const [status, setStatus] = React.useState<TransactionStatus | "">("");
  const [selected, setSelected] = React.useState<SerializedTransaction | null>(null);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTransactionHistoryAction({
        page,
        pageSize: 15,
        search: search || undefined,
        type: type || undefined,
        status: status || undefined
      });
      if (!res.ok) return;
      let next = res.rows;
      if (roleFilterTypes?.length) {
        next = next.filter((r) => roleFilterTypes.includes(r.type));
      }
      setRows(next);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [page, search, type, status, roleFilterTypes]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / 15));

  return (
    <TableWrap>
      <FiltersBar
        search={search}
        setSearch={setSearch}
        type={type}
        setType={setType}
        status={status}
        setStatus={setStatus}
        setPage={setPage}
        roleFilterTypes={roleFilterTypes}
      />
      <TransactionsBody
        rows={rows}
        currency={currency}
        loading={loading}
        onSelect={setSelected}
      />
      <TablePager page={page} pages={pages} setPage={setPage} loading={loading} />
      {selected ? (
        <TransactionDetailModal
          transaction={selected}
          currency={currency}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </TableWrap>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

function FiltersBar(props: {
  search: string;
  setSearch: (v: string) => void;
  type: TransactionType | "";
  setType: (v: TransactionType | "") => void;
  status: TransactionStatus | "";
  setStatus: (v: TransactionStatus | "") => void;
  setPage: (n: number) => void;
  roleFilterTypes?: TransactionType[];
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-[200px] flex-1">
        <Input
          placeholder="Search reference or description…"
          value={props.search}
          onChange={(e) => {
            props.setSearch(e.target.value);
            props.setPage(1);
          }}
        />
      </div>
      <select
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        value={props.type}
        onChange={(e) => {
          props.setType(e.target.value as TransactionType | "");
          props.setPage(1);
        }}
      >
        <option value="">All types</option>
        {(props.roleFilterTypes ?? Object.values(TransactionType)).map((t) => (
          <option key={t} value={t}>
            {t.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <select
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        value={props.status}
        onChange={(e) => {
          props.setStatus(e.target.value as TransactionStatus | "");
          props.setPage(1);
        }}
      >
        <option value="">All statuses</option>
        {Object.values(PaymentStatus).map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}

function TransactionsBody({
  rows,
  currency,
  loading,
  onSelect
}: {
  rows: SerializedTransaction[];
  currency: string;
  loading: boolean;
  onSelect: (r: SerializedTransaction) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/80">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-border/80 bg-muted/30 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Reference</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                {loading ? "Loading…" : "No transactions yet"}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{row.reference.slice(0, 20)}…</td>
                <td className="px-4 py-3 capitalize">{row.type.replace(/_/g, " ").toLowerCase()}</td>
                <td
                  className={cn(
                    "px-4 py-3 font-medium",
                    row.type === TransactionType.WITHDRAWAL ||
                      row.type === TransactionType.ESCROW_HOLD
                      ? "text-foreground"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {formatMoney(row.amount, currency)}
                </td>
                <td className="px-4 py-3">
                  <TransactionStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(row.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button type="button" variant="ghost" size="sm" onClick={() => onSelect(row)}>
                    Details
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function TablePager({
  page,
  pages,
  setPage,
  loading
}: {
  page: number;
  pages: number;
  setPage: (n: number) => void;
  loading: boolean;
}) {
  return (
    <PagerInner>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1 || loading}
        onClick={() => setPage(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {pages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= pages || loading}
        onClick={() => setPage(page + 1)}
      >
        Next
      </Button>
    </PagerInner>
  );
}

function PagerInner({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-2">{children}</div>;
}
