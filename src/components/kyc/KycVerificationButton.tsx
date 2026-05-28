"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitKycAction } from "@/lib/kyc/actions";
import { cn } from "@/lib/utils";

type Props = {
  identityVerified: boolean;
  kycStatus: string | null;
  className?: string;
};

export function KycVerificationButton({
  identityVerified,
  kycStatus,
  className
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [whatsappNumber, setWhatsapp] = React.useState("");
  const [documentType, setDocType] = React.useState("");
  const [documentNumber, setDocNum] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  if (identityVerified) return null;

  const pendingReview = kycStatus === "PENDING";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setPending(true);
    const r = await submitKycAction({ whatsappNumber, documentType, documentNumber });
    setPending(false);
    if (!r.ok) {
      if (r.fieldErrors) setFieldErrors(r.fieldErrors);
      toast.error(r.error);
      return;
    }
    toast.success("Verification submitted. We will review your details soon.");
    setOpen(false);
  }

  return (
    <>
      {!pendingReview ? (
        <Button
          type="button"
          className={cn("gap-2", className)}
          onClick={() => setOpen(true)}
        >
          <ShieldCheck className="h-4 w-4" />
          Verify identity
        </Button>
      ) : (
        <p className={cn("text-sm text-muted-foreground", className)}>
          Identity verification pending review.
        </p>
      )}

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kyc-title"
          >
            <h2 id="kyc-title" className="text-lg font-semibold">
              Identity verification
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Submit your details for manual review. You will be notified when approved.
            </p>
            <form className="mt-4 space-y-4" onSubmit={onSubmit} noValidate>
              <FormField
                id="whatsappNumber"
                label="WhatsApp number"
                error={fieldErrors.whatsappNumber?.[0]}
              >
                <Input
                  id="whatsappNumber"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+234 800 000 0000"
                />
              </FormField>
              <FormField
                id="documentType"
                label="ID type"
                error={fieldErrors.documentType?.[0]}
              >
                <Input
                  id="documentType"
                  value={documentType}
                  onChange={(e) => setDocType(e.target.value)}
                  placeholder="National ID, passport…"
                />
              </FormField>
              <FormField
                id="documentNumber"
                label="ID number"
                error={fieldErrors.documentNumber?.[0]}
              >
                <Input
                  id="documentNumber"
                  value={documentNumber}
                  onChange={(e) => setDocNum(e.target.value)}
                />
              </FormField>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Submitting…" : "Submit"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
