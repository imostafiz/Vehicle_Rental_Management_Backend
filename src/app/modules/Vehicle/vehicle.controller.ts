import { Request, Response } from 'express';
import { catchAsync } from '../../../shared/catchAsync';
import { sendResponse } from '../../../shared/sendResponse';
import { getPhotoUrl } from '../../../helpers/fileUploader';
import {
  getAllVehiclesService,
  getVehicleByIdService,
  createVehicleService,
  updateVehicleService,
  deleteVehicleService,
  IVehicleRow,
} from './vehicle.service';
import { pick } from '../../../shared/pick';

interface IVehicleResponse {
  id: number;
  name: string;
  plate_number: string;
  category: string;
  daily_rate: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

const serializeVehicle = (vehicle: IVehicleRow): IVehicleResponse => ({
  id: vehicle.id,
  name: vehicle.name,
  plate_number: vehicle.plate_number,
  category: vehicle.category,
  daily_rate: vehicle.daily_rate,
  photo_url: getPhotoUrl(vehicle.photo_path ?? undefined),
  created_at: vehicle.created_at,
  updated_at: vehicle.updated_at,
});

export const getAllVehicles = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['category', 'search'] as const) as Record<
    string,
    string | undefined
  >;
  const result = await getAllVehiclesService(
    filters,
    req.query as unknown as Record<string, unknown>,
  );

  sendResponse(res, {
    statusCode: 200,
    // message: 'Vehicles retrieved successfully.',
    meta: {
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
      totalPages: result.meta.totalPages,
    },
    data: result.data.map(serializeVehicle),
  });
});

export const getVehicleById = catchAsync(async (req: Request, res: Response) => {
  const vehicle = await getVehicleByIdService(Number(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    message: 'Vehicle retrieved successfully.',
    data: serializeVehicle(vehicle),
  });
});

export const createVehicle = catchAsync(async (req: Request, res: Response) => {
  const body = req.body as {
    name: string;
    plate_number: string;
    category: string;
    daily_rate: number;
  };
  const filename = req.file?.filename;
  const vehicle = await createVehicleService(body, filename);
  sendResponse(res, {
    statusCode: 201,
    message: 'Vehicle created successfully.',
    data: serializeVehicle(vehicle),
  });
});

export const updateVehicle = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const body = req.body as Record<string, unknown>;
  const filename = req.file?.filename;
  const vehicle = await updateVehicleService(id, body, filename);
  sendResponse(res, {
    statusCode: 200,
    message: 'Vehicle updated successfully.',
    data: serializeVehicle(vehicle),
  });
});

export const deleteVehicle = catchAsync(async (req: Request, res: Response) => {
  await deleteVehicleService(Number(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    message: 'Vehicle deleted successfully.',
  });
});
