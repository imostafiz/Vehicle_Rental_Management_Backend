import config from '../config';

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

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export const paginationHelper = (query: Record<string, unknown>): IPaginationOptions => {
  const page = Math.max(Number(query.page) || DEFAULT_PAGE, 1);
  const rawLimit = Math.max(Number(query.limit) || DEFAULT_LIMIT, 1);
  const limit = Math.min(rawLimit, MAX_LIMIT);
  const sortBy = typeof query.sortBy === 'string' ? query.sortBy : 'created_at';
  const sortOrder: 'asc' | 'desc' =
    query.sortOrder === 'asc' || query.sortOrder === 'desc' ? query.sortOrder : 'desc';
  const skip = (page - 1) * limit;

  return { page, limit, sortBy, sortOrder, skip };
};

export const calculatePagination = (
  total: number,
  options: IPaginationOptions,
): IPaginationResult => {
  const totalPages = total === 0 ? 0 : Math.ceil(total / options.limit);
  return {
    page: options.page,
    limit: options.limit,
    total,
    totalPages,
  };
};

export { config };
