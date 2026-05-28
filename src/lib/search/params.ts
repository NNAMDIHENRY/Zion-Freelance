import {
  BUDGET_PRESETS,
  DEFAULT_PAGE_SIZE,
  PROJECT_BUDGET_PRESETS,
  type FreelancerSort,
  type ProjectSort
} from "@/lib/search/constants";
import {
  freelancerSearchSchema,
  projectSearchSchema,
  type FreelancerSearchParams,
  type ProjectSearchParams
} from "@/lib/validators/search";

type RawSearch = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function rawToObject(raw: RawSearch): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const s = first(v);
    if (s !== undefined && s !== "") out[k] = s;
  }
  return out;
}

function applyBudgetPreset(
  presetId: string | undefined,
  presets: readonly { id: string; min?: number; max?: number }[],
  min?: number,
  max?: number
) {
  if (min !== undefined || max !== undefined) return { min, max };
  if (!presetId || presetId === "any") return { min: undefined, max: undefined };
  const p = presets.find((x) => x.id === presetId);
  if (!p) return { min: undefined, max: undefined };
  return { min: p.min, max: p.max };
}

export function parseFreelancerSearchParams(
  raw: RawSearch
): FreelancerSearchParams & { budgetMin?: number; budgetMax?: number } {
  const obj = rawToObject(raw);
  const skills = obj.skills ?? "";
  const parsed = freelancerSearchSchema.parse({
    ...obj,
    skills: skills || undefined
  });
  const budget = applyBudgetPreset(
    parsed.budgetPreset,
    BUDGET_PRESETS,
    parsed.budgetMin,
    parsed.budgetMax
  );
  return { ...parsed, budgetMin: budget.min, budgetMax: budget.max };
}

export function parseProjectSearchParams(
  raw: RawSearch
): ProjectSearchParams & { budgetMin?: number; budgetMax?: number } {
  const obj = rawToObject(raw);
  const skills = obj.skills ?? "";
  const parsed = projectSearchSchema.parse({
    ...obj,
    skills: skills || undefined
  });
  const budget = applyBudgetPreset(
    parsed.budgetPreset,
    PROJECT_BUDGET_PRESETS,
    parsed.budgetMin,
    parsed.budgetMax
  );
  return { ...parsed, budgetMin: budget.min, budgetMax: budget.max };
}

export function buildFreelancerSearchQuery(
  params: FreelancerSearchParams & { budgetMin?: number; budgetMax?: number }
): string {
  const q = new URLSearchParams();
  if (params.q) q.set("q", params.q);
  if (params.category) q.set("category", params.category);
  if (params.skills.length) q.set("skills", params.skills.join(","));
  if (params.budgetPreset && params.budgetPreset !== "any") q.set("budgetPreset", params.budgetPreset);
  if (params.budgetMin !== undefined) q.set("budgetMin", String(params.budgetMin));
  if (params.budgetMax !== undefined) q.set("budgetMax", String(params.budgetMax));
  if (params.ratingMin !== undefined) q.set("ratingMin", String(params.ratingMin));
  if (params.sort !== "rating") q.set("sort", params.sort);
  if (params.page > 1) q.set("page", String(params.page));
  if (params.pageSize !== DEFAULT_PAGE_SIZE) q.set("pageSize", String(params.pageSize));
  return q.toString();
}

export function buildProjectSearchQuery(
  params: ProjectSearchParams & { budgetMin?: number; budgetMax?: number }
): string {
  const q = new URLSearchParams();
  if (params.q) q.set("q", params.q);
  if (params.category) q.set("category", params.category);
  if (params.skills.length) q.set("skills", params.skills.join(","));
  if (params.budgetPreset && params.budgetPreset !== "any") q.set("budgetPreset", params.budgetPreset);
  if (params.budgetMin !== undefined) q.set("budgetMin", String(params.budgetMin));
  if (params.budgetMax !== undefined) q.set("budgetMax", String(params.budgetMax));
  if (params.sort !== "newest") q.set("sort", params.sort);
  if (params.page > 1) q.set("page", String(params.page));
  if (params.pageSize !== DEFAULT_PAGE_SIZE) q.set("pageSize", String(params.pageSize));
  return q.toString();
}

export function freelancerSortLabel(sort: FreelancerSort): string {
  const map: Record<FreelancerSort, string> = {
    rating: "Highest rated",
    newest: "Newest",
    reviews: "Most reviewed"
  };
  return map[sort];
}

export function projectSortLabel(sort: ProjectSort): string {
  const map: Record<ProjectSort, string> = {
    newest: "Newest",
    budget: "Highest budget",
    deadline: "Closing soon"
  };
  return map[sort];
}
