export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 48;

export const FREELANCER_SORTS = ["rating", "newest", "reviews"] as const;
export type FreelancerSort = (typeof FREELANCER_SORTS)[number];

export const PROJECT_SORTS = ["newest", "budget", "deadline"] as const;
export type ProjectSort = (typeof PROJECT_SORTS)[number];

export const BUDGET_PRESETS = [
  { id: "any", label: "Any budget", min: undefined, max: undefined },
  { id: "under-50", label: "Under $50/hr", min: undefined, max: 50 },
  { id: "50-100", label: "$50 – $100/hr", min: 50, max: 100 },
  { id: "100-200", label: "$100 – $200/hr", min: 100, max: 200 },
  { id: "200-plus", label: "$200+/hr", min: 200, max: undefined }
] as const;

export const PROJECT_BUDGET_PRESETS = [
  { id: "any", label: "Any budget", min: undefined, max: undefined },
  { id: "under-1k", label: "Under $1k", min: undefined, max: 1000 },
  { id: "1k-5k", label: "$1k – $5k", min: 1000, max: 5000 },
  { id: "5k-20k", label: "$5k – $20k", min: 5000, max: 20000 },
  { id: "20k-plus", label: "$20k+", min: 20000, max: undefined }
] as const;

export const RATING_OPTIONS = [
  { value: "", label: "Any rating" },
  { value: "3", label: "3.0+" },
  { value: "3.5", label: "3.5+" },
  { value: "4", label: "4.0+" },
  { value: "4.5", label: "4.5+" }
] as const;
