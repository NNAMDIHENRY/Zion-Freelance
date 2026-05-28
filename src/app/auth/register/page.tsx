"use client";

import type { FormEvent } from "react";
import { Role } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { CategoryMultiSelect } from "@/components/forms/CategoryMultiSelect";
import { SkillsTagInput, type SkillOption } from "@/components/forms/SkillsTagInput";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelect } from "@/components/forms/CountrySelect";
import { phonePrefixForCountryLabel, REFERRAL_SOURCE_OPTIONS } from "@/lib/constants/countries";
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [role, setRole] = useState<Role>(Role.CLIENT);
  const [categorySlugs, setCategorySlugs] = useState<string[]>([]);
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [receiveEmailUpdates, setReceiveEmailUpdates] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
    {}
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/taxonomy")
      .then((r) => r.json())
      .then((j: { skills?: SkillOption[] }) => setSkills(j.skills ?? []))
      .catch(() => setSkills([]));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
      acceptedTerms,
      role,
      categorySlugs: role === Role.FREELANCER ? categorySlugs : undefined,
      skillIds: role === Role.FREELANCER ? skillIds : undefined,
      country,
      phone,
      city,
      referralSource,
      receiveEmailUpdates
    });
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

      router.push("/auth/login?registered=1");
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

        <CountrySelect
          id="country"
          label="Country"
          value={country}
          required
          error={fieldErrors.country?.[0]}
          onChange={(next) => {
            setCountry(next);
            const prefix = phonePrefixForCountryLabel(next);
            if (prefix && !phone.trim()) setPhone(`${prefix} `);
          }}
        />

        <FormField id="city" label="City" error={fieldErrors.city?.[0]}>
          <Input
            id="city"
            name="city"
            autoComplete="address-level2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Lagos"
          />
        </FormField>

        <FormField id="phone" label="Phone number" error={fieldErrors.phone?.[0]}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 000 0000"
          />
        </FormField>

        <FormField
          id="referralSource"
          label="How did you hear about us?"
          error={fieldErrors.referralSource?.[0]}
        >
          <select
            id="referralSource"
            value={referralSource}
            onChange={(e) => setReferralSource(e.target.value)}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select an option</option>
            {REFERRAL_SOURCE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </FormField>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 px-3 py-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-input"
            checked={receiveEmailUpdates}
            onChange={(e) => setReceiveEmailUpdates(e.target.checked)}
          />
          <span>
            <span className="font-medium text-foreground">Email updates</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Receive product news, project alerts, and account notifications by email.
            </span>
          </span>
        </label>

        {role === Role.FREELANCER ? (
          <>
            <CategoryMultiSelect
              value={categorySlugs}
              onChange={setCategorySlugs}
              error={fieldErrors.categorySlugs?.[0]}
            />
            <SkillsTagInput
              options={skills}
              value={skillIds}
              onChange={setSkillIds}
              error={fieldErrors.skillIds?.[0]}
            />
          </>
        ) : null}

        <FormField
          id="password"
          label="Password"
          error={fieldErrors.password?.[0]}
          hint="At least 8 characters with upper, lower, and a number."
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
          />
        </FormField>

        <FormField
          id="confirmPassword"
          label="Confirm password"
          error={fieldErrors.confirmPassword?.[0]}
        >
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
          />
        </FormField>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 px-3 py-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-input"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
          />
          <span>
            I agree to the{" "}
            <a href="/terms" className="font-medium underline" target="_blank" rel="noreferrer">
              Terms &amp; Conditions
            </a>{" "}
            and{" "}
            <a href="/privacy" className="font-medium underline" target="_blank" rel="noreferrer">
              Privacy Policy
            </a>
            .
          </span>
        </label>
        {fieldErrors.acceptedTerms?.[0] ? (
          <p className="text-xs font-medium text-destructive" role="alert">
            {fieldErrors.acceptedTerms[0]}
          </p>
        ) : null}

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
