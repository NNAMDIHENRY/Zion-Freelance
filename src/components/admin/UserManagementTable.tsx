"use client";

import { AccountStatus, Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { adminUserActionAction } from "@/lib/admin/actions";
import type { AdminUserRow } from "@/lib/admin/users/service";

const STATUS_LABEL: Record<AccountStatus, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  RESTRICTED: "Restricted"
};

type UserAction =
  | "suspend"
  | "reactivate"
  | "verify"
  | "flag"
  | "unflag"
  | "restrict"
  | "unrestrict";

export function UserManagementTable({ items }: { items: AdminUserRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(userId: string, action: UserAction) {
    startTransition(async () => {
      const res = await adminUserActionAction({ userId, action });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("User updated");
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
        No users match your filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-subtle">
      <table className="w-full min-w-[48rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Wallet</th>
            <th className="px-4 py-3">Joined</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id} className="border-b border-border/40 last:border-0">
              <td className="px-4 py-3">
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
                {u.moderationFlag ? (
                  <span className="mt-1 inline-block rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700">
                    Flagged
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3">{u.role}</td>
              <td className="px-4 py-3">
                <span>{STATUS_LABEL[u.accountStatus]}</span>
                {u.verified ? (
                  <span className="ml-2 text-xs text-emerald-600">Verified</span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{u.walletBalance ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {u.accountStatus === AccountStatus.ACTIVE ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => run(u.id, "suspend")}
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => run(u.id, "reactivate")}
                    >
                      Reactivate
                    </Button>
                  )}
                  {!u.verified ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => run(u.id, "verify")}
                    >
                      Verify
                    </Button>
                  ) : null}
                  {!u.moderationFlag ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => run(u.id, "flag")}
                    >
                      Flag
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => run(u.id, "unflag")}
                    >
                      Unflag
                    </Button>
                  )}
                  {u.role !== Role.ADMIN && u.accountStatus !== AccountStatus.RESTRICTED ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => run(u.id, "restrict")}
                    >
                      Restrict
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
