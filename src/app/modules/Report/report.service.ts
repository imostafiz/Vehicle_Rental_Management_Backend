import db from '../../../shared/db';
import { ApiError } from '../../errors/ApiError';

export interface IRentalReportRow {
  id: number;
  name: string;
  total_bookings: number;
  days_rented: number;
  revenue: number;
}

export interface IRentalReportResult {
  vehicles: IRentalReportRow[];
  topVehicle: IRentalReportRow | null;
}

const REPORT_SQL = `
  WITH month_bounds AS (
    SELECT
      to_date(?, 'YYYY-MM') AS month_start,
      (to_date(?, 'YYYY-MM') + interval '1 month' - interval '1 day')::date AS month_end
  ),
  rental_overlap AS (
    SELECT
      v.id AS vehicle_id,
      v.name AS vehicle_name,
      r.id AS rental_id,
      (LEAST(r.end_date, mb.month_end) - GREATEST(r.start_date, mb.month_start) + 1) AS days_in_month,
      v.daily_rate
    FROM rentals r
    JOIN vehicles v ON v.id = r.vehicle_id
    CROSS JOIN month_bounds mb
    WHERE r.status <> 'cancelled'
      AND r.start_date <= mb.month_end
      AND r.end_date >= mb.month_start
      AND v.deleted_at IS NULL
      {vehicleFilter}
  )
  SELECT
    vehicle_id AS id,
    vehicle_name AS name,
    COUNT(*) AS total_bookings,
    COALESCE(SUM(days_in_month), 0) AS days_rented,
    COALESCE(SUM(daily_rate * days_in_month), 0) AS revenue
  FROM rental_overlap
  GROUP BY vehicle_id, vehicle_name
  ORDER BY revenue DESC, total_bookings DESC, id ASC
`;

export const rentalReportService = async (
  month: string,
  vehicleId?: number,
): Promise<IRentalReportResult> => {
  const vehicleFilter = vehicleId !== undefined ? 'AND r.vehicle_id = ?' : '';

  const params: Array<string | number> = [month, month];
  if (vehicleId !== undefined) {
    params.push(vehicleId);
  }

  const sql = REPORT_SQL.replace('{vehicleFilter}', vehicleFilter);

  const result = await db.raw<{ rows: IRentalReportRow[] }>(sql, params);

  const vehicles = result.rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    total_bookings: Number(row.total_bookings),
    days_rented: Number(row.days_rented),
    revenue: Number(row.revenue),
  }));

  const topVehicle = vehicles.length > 0 ? vehicles[0] : null;

  return { vehicles, topVehicle };
};

export const validateMonth = (month: string): string => {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) {
    throw new ApiError(400, 'month must be in YYYY-MM format.');
  }
  const monthNum = Number(match[2]);
  const yearNum = Number(match[1]);
  if (monthNum < 1 || monthNum > 12 || yearNum < 2000 || yearNum > 2100) {
    throw new ApiError(400, 'month must be in YYYY-MM format.');
  }
  return month;
};
