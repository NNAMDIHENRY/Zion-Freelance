import { jobSearchSchema } from "@/lib/validators/job";

export function parseJobSearchParams(
  searchParams: Record<string, string | string[] | undefined>
) {
  const get = (k: string) => {
    const v = searchParams[k];
    return Array.isArray(v) ? v[0] : v;
  };

  return jobSearchSchema.parse({
    q: get("q"),
    categoryId: get("categoryId"),
    categorySlug: get("category"),
    workMode: get("workMode"),
    employmentType: get("employmentType"),
    experienceLevel: get("experienceLevel"),
    country: get("country"),
    city: get("city"),
    salaryMin: get("salaryMin"),
    salaryMax: get("salaryMax"),
    featured: get("featured") === "1" ? true : undefined,
    urgent: get("urgent") === "1" ? true : undefined,
    postedWithinDays: get("postedWithinDays"),
    sort: get("sort"),
    page: get("page"),
    pageSize: get("pageSize")
  });
}
