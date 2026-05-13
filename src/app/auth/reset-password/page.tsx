"use client";

import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordSchema } from "@/lib/validators/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = useMemo(
    () => searchParams.get("token") ?? "",
    [searchParams]
  );

  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
    {}
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = resetPasswordSchema.safeParse({
      token: tokenFromUrl,
      password
    });
    if (!parsed.success) {
      setFieldErrors(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data)
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        fieldErrors?: Record<string, string[] | undefined>;
      };

      if (!res.ok) {
        if (data.fieldErrors) {
          setFieldErrors(
            Object.fromEntries(
              Object.entries(data.fieldErrors).map(([k, v]) => [
                k,
                v ?? []
              ])
            )
          );
        }
        setFormError(data.error ?? "Could not reset password.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 1200);
    } finally {
      setLoading(false);
    }
  }

  if (!tokenFromUrl) {
    return (
      <AuthShell
        title="Invalid reset link"
        subtitle="Open the link from your email, or request a new reset."
        footer={
          <Link className="font-medium text-foreground underline" href="/auth/forgot-password">
            Request a new link
          </Link>
        }
      >
        <FormAlert variant="error">
          This page needs a valid token in the URL.
        </FormAlert>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Use a strong password you have not used elsewhere."
      footer={
        <Link className="font-medium text-foreground underline" href="/auth/login">
          Back to sign in
        </Link>
      }
    >
      {success ? (
        <FormAlert variant="success">
          Password updated. Redirecting to sign in…
        </FormAlert>
      ) : (
        <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
          {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}

          <FormField
            id="password"
            label="New password"
            error={fieldErrors.password?.[0]}
            hint="At least 8 characters with upper, lower, and a number."
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
            />
          </FormField>

          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Updating…
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
