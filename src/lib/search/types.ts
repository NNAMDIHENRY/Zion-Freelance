export type FreelancerSearchRow = {
  id: string;
  userId: string;
  name: string;
  headline: string | null;
  bioPreview: string | null;
  hourlyRate: string | null;
  ratingAverage: string;
  ratingCount: number;
  planTier?: string;
  verified?: boolean;
  skills: string[];
};

export type ProjectSearchRow = {
  id: string;
  title: string;
  descriptionPreview: string;
  category: string | null;
  budgetLabel: string;
  deadline: string | null;
  skillNames: string[];
  createdAt: string;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
