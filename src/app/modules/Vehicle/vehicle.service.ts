import fs from 'fs';
import path from 'path';
import db from '../../../shared/db';
import { ApiError } from '../../errors/ApiError';
import { paginationHelper } from '../../../helpers/paginationHelper';
import config from '../../../config';

export interface IVehicleRow {
  id: number;
  name: string;
  plate_number: string;
  category: string;
  daily_rate: string;
  photo_path: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IVehicleCreateData {
  name: string;
  plate_number: string;
  category: string;
  daily_rate: number;
}

export interface IVehicleUpdateData {
  name?: string;
  plate_number?: string;
  category?: string;
  daily_rate?: number;
}

interface IVehicleFilters {
  category?: string;
  search?: string;
}

interface IVehicleListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface IVehicleListResult {
  data: IVehicleRow[];
  meta: IVehicleListMeta;
}

const uploadDir = (): string => path.resolve(process.cwd(), config.upload.path);

export const getAllVehiclesService = async (
  filters: IVehicleFilters,
  query: Record<string, unknown>,
): Promise<IVehicleListResult> => {
  const { page, limit, sortBy, sortOrder, skip } = paginationHelper(query);

  const baseQuery = db<IVehicleRow>('vehicles').whereNull('deleted_at');

  if (filters.category) {
    baseQuery.andWhere('category', filters.category);
  }
  if (filters.search) {
    baseQuery.andWhere((builder) => {
      builder.whereILike('name', `%${filters.search}%`);
    });
  }

  const countQuery = baseQuery
    .clone()
    .clearSelect()
    .clearOrder()
    .count<{ total: string }[]>({ total: '*' });

  const sortableColumns = [
    'name',
    'plate_number',
    'category',
    'daily_rate',
    'created_at',
    'updated_at',
  ];
  const effectiveSortBy = sortableColumns.includes(sortBy) ? sortBy : 'created_at';
  const effectiveSortOrder = sortOrder;

  const data = await baseQuery
    .clone()
    .orderBy(effectiveSortBy, effectiveSortOrder)
    .limit(limit)
    .offset(skip);

  const countResult = await countQuery;
  const total = Number(countResult[0]?.total ?? 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      sortBy: effectiveSortBy,
      sortOrder: effectiveSortOrder,
    },
  };
};

export const getVehicleByIdService = async (id: number): Promise<IVehicleRow> => {
  const vehicle = await db<IVehicleRow>('vehicles').where({ id }).whereNull('deleted_at').first();
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found.');
  }
  return vehicle;
};

export const createVehicleService = async (
  data: IVehicleCreateData,
  filename?: string,
): Promise<IVehicleRow> => {
  const [vehicle] = await db<IVehicleRow>('vehicles')
    .insert({
      name: data.name,
      plate_number: data.plate_number,
      category: data.category,
      daily_rate: String(data.daily_rate),
      photo_path: filename ?? null,
    })
    .returning('*');

  return vehicle;
};

export const updateVehicleService = async (
  id: number,
  data: IVehicleUpdateData,
  filename?: string,
): Promise<IVehicleRow> => {
  const existing = await getVehicleByIdService(id);

  const updatePayload: Record<string, unknown> = { ...data };
  if (filename) {
    updatePayload.photo_path = filename;
  }

  const [updated] = await db<IVehicleRow>('vehicles')
    .where({ id })
    .update({ ...updatePayload, updated_at: db.fn.now() })
    .returning('*');

  if (filename && existing.photo_path) {
    removeStoredFile(existing.photo_path);
  }

  return updated;
};

export const deleteVehicleService = async (id: number): Promise<void> => {
  await getVehicleByIdService(id);
  await db('vehicles').where({ id }).update({ deleted_at: db.fn.now() });
};

const removeStoredFile = (filename: string): void => {
  try {
    const fullPath = path.join(uploadDir(), path.basename(filename));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch {
    // ignore cleanup errors
  }
};
