"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { withdrawJobApplication } from "@/lib/jobs/actions";

export function WithdrawApplicationButton({ applicationId }: { applicationId: string }) {
  async function withdraw() {
    if (!confirm("Withdraw this application?")) return;
    const r = await withdrawJobApplication(applicationId);
    if (!r.ok) toast.error(r.error);
    else toast.success("Application withdrawn");
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={withdraw}>
      Withdraw
    </Button>
  );
}
