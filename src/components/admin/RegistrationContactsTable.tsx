"use client";

import Link from "next/link";

import { Input } from "@/components/ui/input";

type Row = {
  id: string;
  userId: string;
  name: string;
  role: string;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  referralSource: string | null;
  registeredAt: string;
};

export function RegistrationContactsTable({
  data,
  query
}: {
  data: {
    items: Row[];
    page: number;
    totalPages: number;
    total: number;
  };
  query: string;
}) {
  return (
    <div className="space-y-4">
      <form className="flex max-w-md gap-2" method="get">
        <Input name="q" defaultValue={query} placeholder="Search email, phone, name…" />
        <button
          type="submit"
          className="inline-flex h-10 shrink-0 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Search
        </button>
      </form>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Referral</th>
              <th className="px-4 py-3">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.items.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/users`} className="text-primary hover:underline">
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{r.role}</td>
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3">{r.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  {[r.city, r.country].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 max-w-[180px] truncate">{r.referralSource ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(r.registeredAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        {data.total} registrations · page {data.page} of {data.totalPages}
      </p>
    </div>
  );
}
