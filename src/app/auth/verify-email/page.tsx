"use client";

import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const pending = searchParams.get("pending") === "1";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setStatus("verifying");
    void fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token })
    })
      .then(async (res) => {
        const data = (await res.json()) as { error?: string; ok?: boolean };
        if (cancelled) return;
        if (res.ok && data.ok) {
          setStatus("ok");
          setMessage("Email verified. You can sign in now.");
          return;
        }
        setStatus("error");
        setMessage(data.error ?? "Verification failed.");
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
          setMessage("Network error.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function resend(e: FormEvent) {
    e.preventDefault();
    setResendLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (res.ok && data.ok) {
        setMessage("Verification email sent if the account exists and is unverified.");
      } else {
        setMessage(data.error ?? "Could not resend.");
      }
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <AuthShell
      title="Verify your email"
      subtitle={
        pending
          ? "Verify your email to access the platform."
          : "Confirm your address to unlock your account."
      }
      footer={
        <p>
          <button
            type="button"
            className="font-medium text-foreground underline"
            onClick={() => router.push("/auth/login")}
          >
            Back to sign in
          </button>
        </p>
      }
    >
      {token ? (
        <div className="space-y-4 text-sm">
          {status === "verifying" ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </p>
          ) : null}
          {message ? (
            <FormAlert variant={status === "ok" ? "success" : "error"}>{message}</FormAlert>
          ) : null}
          {status === "ok" ? (
            <Button className="w-full" onClick={() => router.push("/auth/login")}>
              Sign in
            </Button>
          ) : null}
        </div>
      ) : (
        <form className="space-y-4" onSubmit={resend} noValidate>
          {message ? (
            <FormAlert variant={message.includes("sent") ? "success" : "error"}>
              {message}
            </FormAlert>
          ) : null}
          <FormField id="email" label="Email">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={resendLoading}>
            {resendLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Resend verification email"
            )}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
