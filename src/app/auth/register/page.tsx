"use client";

import type { FormEvent } from "react";
import { Role } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema } from "@/lib/validators/auth";
import { cn } from "@/lib/utils";

const roles: Array<{ value: Role; label: string; description: string }> = [
  {
    value: Role.CLIENT,
    label: "Client",
    description: "Post projects and hire talent."
  },
  {
    value: Role.FREELANCER,
    label: "Freelancer",
    description: "Browse work and send proposals."
  }
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(Role.CLIENT);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
    {}
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = registerSchema.safeParse({ name, email, password, role });
    if (!parsed.success) {
      setFieldErrors(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
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
        setFormError(data.error ?? "Could not create account.");
        return;
      }

      const sign = await signIn("credentials", {
        redirect: false,
        email: parsed.data.email,
        password: parsed.data.password,
        callbackUrl: "/dashboard"
      });

      if (sign?.error) {
        setFormError("Account created. Please sign in.");
        router.push("/auth/login");
        return;
      }

      router.push(sign?.url ?? "/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Choose how you will use the marketplace."
      footer={
        <p>
          Already have an account?{" "}
          <a className="font-medium text-foreground underline" href="/auth/login">
            Sign in
          </a>
        </p>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
        {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}

        <FormField id="name" label="Full name" error={fieldErrors.name?.[0]}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
          />
        </FormField>

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

        <div className="flex flex-col gap-2">
          <Label className="text-foreground">I am a</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((r) => {
              const selected = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left text-sm transition-colors",
                    selected
                      ? "border-primary bg-primary/5 ring-2 ring-ring"
                      : "border-border hover:bg-muted/60"
                  )}
                >
                  <div className="font-semibold">{r.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {r.description}
                  </div>
                </button>
              );
            })}
          </div>
          {fieldErrors.role?.[0] ? (
            <p className="text-xs font-medium text-destructive" role="alert">
              {fieldErrors.role[0]}
            </p>
          ) : null}
        </div>

        <FormField
          id="password"
          label="Password"
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
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
