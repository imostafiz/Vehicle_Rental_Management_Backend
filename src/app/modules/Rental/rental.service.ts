import db from '../../../shared/db';
import { ApiError } from '../../errors/ApiError';
import { paginationHelper } from '../../../helpers/paginationHelper';

export type RentalStatus = 'booked' | 'ongoing' | 'completed' | 'cancelled';

export const ACTIVE_STATUSES: RentalStatus[] = ['booked', 'ongoing'];

export interface IRentalRow {
  id: number;
  vehicle_id: number;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  total_amount: string;
  status: RentalStatus;
  created_at: string;
  updated_at: string;
}

export interface IRentalCreateData {
  vehicle_id: number;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
}

export interface IRentalUpdateData {
  vehicle_id?: number;
  customer_name?: string;
  customer_phone?: string;
  start_date?: string;
  end_date?: string;
  status?: RentalStatus;
}

interface IRentalFilters {
  vehicle_id?: number;
  status?: RentalStatus;
  from?: string;
  to?: string;
}

const OVERLAP_SQL = `
  SELECT COUNT(*)::int AS count
  FROM rentals
  WHERE vehicle_id = ?
    AND status IN (${ACTIVE_STATUSES.map(() => '?').join(', ')})
    AND id <> COALESCE(?, 0)
    AND start_date <= ?::date
    AND end_date >= ?::date
`;

export const calcRentalDays = (startDate: string, endDate: string): number => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError(400, 'Invalid date format.');
  }
  const diffMs = end.getTime() - start.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) {
    throw new ApiError(400, 'end_date must be on or after start_date.');
  }
  return days + 1;
};

const ensureRentalDatesValid = (
  startDate?: string,
  endDate?: string,
  existing?: { start_date: string; end_date: string },
): void => {
  const start = startDate ?? existing?.start_date;
  const end = endDate ?? existing?.end_date;
  if (start && end) {
    calcRentalDays(start, end);
  }
};

export const getAllRentalsService = async (
  filters: IRentalFilters,
  query: Record<string, unknown>,
): Promise<{ data: IRentalRow[]; meta: Record<string, unknown> }> => {
  const { page, limit, sortBy, sortOrder, skip } = paginationHelper(query);

  const baseQuery = db<IRentalRow>('rentals');

  if (filters.vehicle_id !== undefined) {
    baseQuery.where('vehicle_id', filters.vehicle_id);
  }
  if (filters.status) {
    baseQuery.where('status', filters.status);
  }
  if (filters.from && filters.to) {
    baseQuery.whereRaw('start_date <= ?::date AND end_date >= ?::date', [filters.to, filters.from]);
  } else if (filters.from) {
    baseQuery.where('end_date', '>=', filters.from);
  } else if (filters.to) {
    baseQuery.where('start_date', '<=', filters.to);
  }

  const countQuery = baseQuery
    .clone()
    .clearSelect()
    .clearOrder()
    .count<{ total: string }[]>({ total: '*' });

  const sortableColumns = [
    'customer_name',
    'customer_phone',
    'start_date',
    'end_date',
    'total_amount',
    'status',
    'created_at',
    'updated_at',
    'vehicle_id',
  ];
  const effectiveSortBy = sortableColumns.includes(sortBy) ? sortBy : 'created_at';

  const data = await baseQuery
    .clone()
    .orderBy(effectiveSortBy, sortOrder)
    .limit(limit)
    .offset(skip);

  const countResult = await countQuery;
  const total = Number(countResult[0]?.total ?? 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return { data, meta: { page, limit, total, totalPages } };
};

export const getRentalByIdService = async (id: number): Promise<IRentalRow> => {
  const rental = await db<IRentalRow>('rentals').where({ id }).first();
  if (!rental) {
    throw new ApiError(404, 'Rental not found.');
  }
  return rental;
};

const checkOverlap = async (
  trx: typeof db,
  vehicleId: number,
  startDate: string,
  endDate: string,
  excludeRentalId?: number,
): Promise<void> => {
  const result = await trx.raw<{ rows: { count: number }[] }>(OVERLAP_SQL, [
    vehicleId,
    ...ACTIVE_STATUSES,
    excludeRentalId ?? 0,
    endDate,
    startDate,
  ]);
  const count = result.rows[0]?.count ?? 0;
  if (count > 0) {
    throw new ApiError(409, 'This vehicle is already rented for an overlapping date range.');
  }
};

export const createRentalService = async (data: IRentalCreateData): Promise<IRentalRow> => {
  const days = calcRentalDays(data.start_date, data.end_date);

  const result = await db.transaction(async (trx) => {
    const locked = await trx('vehicles')
      .select('id', 'daily_rate')
      .where({ id: data.vehicle_id })
      .whereNull('deleted_at')
      .forUpdate()
      .first();

    if (!locked) {
      throw new ApiError(404, 'Vehicle not found or has been deleted.');
    }

    await checkOverlap(trx, data.vehicle_id, data.start_date, data.end_date);

    const totalAmount = Number(locked.daily_rate) * days;

    const [rental] = await trx<IRentalRow>('rentals')
      .insert({
        vehicle_id: data.vehicle_id,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        start_date: data.start_date,
        end_date: data.end_date,
        total_amount: String(totalAmount),
        status: 'booked',
      })
      .returning('*');

    return rental;
  });

  return result;
};

export const updateRentalService = async (
  id: number,
  data: IRentalUpdateData,
): Promise<IRentalRow> => {
  const existing = await getRentalByIdService(id);

  const newVehicleId = data.vehicle_id ?? existing.vehicle_id;
  const newStartDate = data.start_date ?? existing.start_date;
  const newEndDate = data.end_date ?? existing.end_date;
  const newStatus = data.status ?? existing.status;

  ensureRentalDatesValid(data.start_date, data.end_date, existing);

  if (
    (data.vehicle_id && data.vehicle_id !== existing.vehicle_id) ||
    (data.start_date && data.start_date !== existing.start_date) ||
    (data.end_date && data.end_date !== existing.end_date)
  ) {
    const days = calcRentalDays(newStartDate, newEndDate);

    const result = await db.transaction(async (trx) => {
      const locked = await trx('vehicles')
        .select('id', 'daily_rate')
        .where({ id: newVehicleId })
        .whereNull('deleted_at')
        .forUpdate()
        .first();

      if (!locked) {
        throw new ApiError(404, 'Vehicle not found or has been deleted.');
      }

      await checkOverlap(trx, newVehicleId, newStartDate, newEndDate, id);

      const totalAmount = Number(locked.daily_rate) * days;

      const [rental] = await trx<IRentalRow>('rentals')
        .where({ id })
        .update({
          vehicle_id: newVehicleId,
          start_date: newStartDate,
          end_date: newEndDate,
          total_amount: String(totalAmount),
          status: newStatus,
          ...(data.customer_name !== undefined && { customer_name: data.customer_name }),
          ...(data.customer_phone !== undefined && { customer_phone: data.customer_phone }),
          updated_at: trx.fn.now(),
        })
        .returning('*');

      return rental;
    });

    return result;
  }

  const [rental] = await db<IRentalRow>('rentals')
    .where({ id })
    .update({
      ...(data.customer_name !== undefined && { customer_name: data.customer_name }),
      ...(data.customer_phone !== undefined && { customer_phone: data.customer_phone }),
      ...(data.status !== undefined && { status: data.status }),
      updated_at: db.fn.now(),
    })
    .returning('*');

  return rental;
};

export const deleteRentalService = async (id: number): Promise<void> => {
  await getRentalByIdService(id);
  await db('rentals').where({ id }).del();
};
