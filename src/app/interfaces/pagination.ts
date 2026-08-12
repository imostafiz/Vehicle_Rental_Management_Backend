export interface IPaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  skip: number;
}

export interface IPaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
