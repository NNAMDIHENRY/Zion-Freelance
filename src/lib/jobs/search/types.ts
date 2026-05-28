import type {
  EmploymentType,
  ExperienceLevel,
  JobStatus,
  SalaryType,
  WorkMode
} from "@prisma/client";

export type JobSearchRow = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  companyName: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryMin: string | null;
  salaryMax: string | null;
  salaryType: SalaryType | null;
  currency: string;
  city: string | null;
  country: string | null;
  categoryName: string;
  skills: string[];
  featured: boolean;
  urgentHiring: boolean;
  verifiedEmployerBadge: boolean;
  applicationDeadline: string | null;
  publishedAt: string | null;
  createdAt: string;
};

export type PaginatedJobs<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type JobSearchContext = {
  q?: string;
  categoryId?: string;
  categorySlug?: string;
  workMode?: WorkMode;
  employmentType?: EmploymentType;
  experienceLevel?: ExperienceLevel;
  country?: string;
  city?: string;
  salaryMin?: number;
  salaryMax?: number;
  featured?: boolean;
  urgent?: boolean;
  postedWithinDays?: number;
  sort: "newest" | "oldest" | "salary_desc" | "salary_asc" | "deadline";
  page: number;
  pageSize: number;
  status?: JobStatus;
};
