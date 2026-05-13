"use client";

import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/lib/validators/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(
    () => searchParams.get("callbackUrl") ?? "/dashboard",
    [searchParams]
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
    {}
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: parsed.data.email,
        password: parsed.data.password,
        callbackUrl
      });

      if (res?.error) {
        if (res.error === "Configuration") {
          setFormError(
            "Authentication is misconfigured. Set NEXTAUTH_SECRET and NEXTAUTH_URL."
          );
        } else {
          setFormError("Invalid email or password.");
        }
        return;
      }

      router.push(res?.url ?? callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your email and password."
      footer={
        <p>
          New here?{" "}
          <a className="font-medium text-foreground underline" href="/auth/register">
            Create an account
          </a>
        </p>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
        {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}

        <FormField
          id="email"
          label="Email"
          error={fieldErrors.email?.[0]}
        >
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />
        </FormField>

        <FormField
          id="password"
          label="Password"
          error={fieldErrors.password?.[0]}
          hint={
            <span>
              <a
                className="font-medium text-foreground underline"
                href="/auth/forgot-password"
              >
                Forgot password?
              </a>
            </span>
          }
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </FormField>

        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
