import Link from "next/link";

import { cn } from "@/lib/utils";

const rows = [
  {
    feature: "Active project listings",
    starter: "Up to 3",
    pro: "Unlimited",
    enterprise: "Unlimited"
  },
  {
    feature: "Search visibility",
    starter: "Standard",
    pro: "Featured placement",
    enterprise: "Curated spotlight"
  },
  {
    feature: "Proposals & contracts",
    starter: "Core templates",
    pro: "Advanced milestones",
    enterprise: "Custom legal workflows"
  },
  {
    feature: "Support",
    starter: "Community",
    pro: "Email (24h)",
    enterprise: "Dedicated manager"
  },
  {
    feature: "Reporting & API",
    starter: "—",
    pro: "Insights dashboard",
    enterprise: "Full API & SSO"
  }
];

export function PricingComparison({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-border/70 shadow-subtle", className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/70 bg-muted/40">
            <th className="px-4 py-4 font-semibold sm:px-6">Capability</th>
            <th className="px-4 py-4 font-semibold sm:px-6">Starter</th>
            <th className="px-4 py-4 font-semibold sm:px-6 text-violet-700 dark:text-violet-300">
              Professional
            </th>
            <th className="px-4 py-4 font-semibold sm:px-6">Enterprise</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-3.5 text-muted-foreground sm:px-6">{row.feature}</td>
              <td className="px-4 py-3.5 sm:px-6">{row.starter}</td>
              <td className="bg-violet-500/[0.06] px-4 py-3.5 sm:px-6">{row.pro}</td>
              <td className="px-4 py-3.5 sm:px-6">{row.enterprise}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-4 py-4 text-xs text-muted-foreground sm:px-6">
        <span>Need a tailored rollout? Our team maps procurement, security, and onboarding.</span>
        <Link href="/contact" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Contact sales
        </Link>
      </div>
    </div>
  );
}
