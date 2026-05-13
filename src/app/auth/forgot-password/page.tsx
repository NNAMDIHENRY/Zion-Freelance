"use client";

import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema } from "@/lib/validators/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
    {}
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    setFieldErrors({});

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldErrors(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data)
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
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
        setFormError(data.error ?? "Something went wrong.");
        return;
      }

      setSuccess(
        data.message ??
          "If an account exists for that email, we sent reset instructions."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We will email you a secure link to reset your password."
      footer={
        <p>
          Remembered it?{" "}
          <a className="font-medium text-foreground underline" href="/auth/login">
            Back to sign in
          </a>
        </p>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
        {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}
        {success ? <FormAlert variant="success">{success}</FormAlert> : null}

        <FormField id="email" label="Email" error={fieldErrors.email?.[0]}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </FormField>

        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Sending…
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
