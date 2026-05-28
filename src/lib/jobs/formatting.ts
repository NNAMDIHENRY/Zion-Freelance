import type { EmploymentType, ExperienceLevel, SalaryType, WorkMode } from "@prisma/client";

const workModeLabels: Record<WorkMode, string> = {
  REMOTE: "Remote",
  ONSITE: "On-site",
  HYBRID: "Hybrid"
};

const employmentLabels: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  TEMPORARY: "Temporary",
  INTERNSHIP: "Internship",
  FREELANCE: "Freelance"
};

const experienceLabels: Record<ExperienceLevel, string> = {
  ENTRY: "Entry level",
  JUNIOR: "Junior",
  MID: "Mid level",
  SENIOR: "Senior",
  LEAD: "Lead",
  EXECUTIVE: "Executive"
};

const salaryTypeLabels: Record<SalaryType, string> = {
  HOURLY: "/hr",
  MONTHLY: "/mo",
  YEARLY: "/yr",
  FIXED: "",
  NEGOTIABLE: ""
};

export function labelWorkMode(m: WorkMode) {
  return workModeLabels[m];
}

export function labelEmploymentType(t: EmploymentType) {
  return employmentLabels[t];
}

export function labelExperienceLevel(l: ExperienceLevel) {
  return experienceLabels[l];
}

export function formatSalaryRange(params: {
  min: string | null;
  max: string | null;
  currency: string;
  salaryType: SalaryType | null;
}): string {
  const { min, max, currency, salaryType } = params;
  const suffix = salaryType && salaryType !== "NEGOTIABLE" ? salaryTypeLabels[salaryType] : "";
  if (salaryType === "NEGOTIABLE" || (!min && !max)) return "Negotiable";
  if (min && max) return `${currency} ${min} – ${max}${suffix}`;
  if (min) return `From ${currency} ${min}${suffix}`;
  if (max) return `Up to ${currency} ${max}${suffix}`;
  return "Not specified";
}

export function locationLabel(job: {
  workMode: WorkMode;
  city?: string | null;
  stateProvince?: string | null;
  country?: string | null;
}): string {
  if (job.workMode === "REMOTE") return "Remote";
  const parts = [job.city, job.stateProvince, job.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "Location TBD";
}
