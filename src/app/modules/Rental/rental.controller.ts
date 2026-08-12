import { Request, Response } from 'express';
import { catchAsync } from '../../../shared/catchAsync';
import { sendResponse } from '../../../shared/sendResponse';
import { pick } from '../../../shared/pick';
import {
  getAllRentalsService,
  getRentalByIdService,
  createRentalService,
  updateRentalService,
  deleteRentalService,
  RentalStatus,
} from './rental.service';
import { ApiError } from '../../errors/ApiError';

const validStatuses: RentalStatus[] = ['booked', 'ongoing', 'completed', 'cancelled'];

export const getAllRentals = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['status', 'from', 'to'] as const) as Record<
    string,
    string | undefined
  >;

  let vehicleId: number | undefined;
  if (req.query.vehicle_id !== undefined) {
    vehicleId = Number(req.query.vehicle_id);
    if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
      throw new ApiError(400, 'vehicle_id must be a positive integer.');
    }
  }

  let status: RentalStatus | undefined;
  if (filters.status !== undefined) {
    if (!validStatuses.includes(filters.status as RentalStatus)) {
      throw new ApiError(400, `status must be one of: ${validStatuses.join(', ')}.`);
    }
    status = filters.status as RentalStatus;
  }

  const result = await getAllRentalsService(
    { vehicle_id: vehicleId, status, from: filters.from, to: filters.to },
    req.query as unknown as Record<string, unknown>,
  );

  sendResponse(res, {
    statusCode: 200,
    message: 'Rentals retrieved successfully.',
    meta: result.meta as { page: number; limit: number; total: number; totalPages: number },
    data: result.data,
  });
});

export const getRentalById = catchAsync(async (req: Request, res: Response) => {
  const rental = await getRentalByIdService(Number(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    message: 'Rental retrieved successfully.',
    data: rental,
  });
});

export const createRental = catchAsync(async (req: Request, res: Response) => {
  const body = req.body as {
    vehicle_id: number;
    customer_name: string;
    customer_phone: string;
    start_date: string;
    end_date: string;
  };
  const rental = await createRentalService(body);
  sendResponse(res, {
    statusCode: 201,
    message: 'Rental created successfully.',
    data: rental,
  });
});

export const updateRental = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const body = req.body as Record<string, unknown>;
  const rental = await updateRentalService(id, body);
  sendResponse(res, {
    statusCode: 200,
    message: 'Rental updated successfully.',
    data: rental,
  });
});

export const deleteRental = catchAsync(async (req: Request, res: Response) => {
  await deleteRentalService(Number(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    message: 'Rental deleted successfully.',
  });
});
