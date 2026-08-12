import { Request, Response } from 'express';
import { catchAsync } from '../../../shared/catchAsync';
import { sendResponse } from '../../../shared/sendResponse';
import { rentalReportService, validateMonth } from './report.service';
import { ApiError } from '../../errors/ApiError';

export const rentalReport = catchAsync(async (req: Request, res: Response) => {
  const month = validateMonth(String(req.query.month ?? ''));

  let vehicleId: number | undefined;
  if (req.query.vehicle_id !== undefined) {
    vehicleId = Number(req.query.vehicle_id);
    if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
      throw new ApiError(400, 'vehicle_id must be a positive integer.');
    }
  }

  const result = await rentalReportService(month, vehicleId);

  sendResponse(res, {
    statusCode: 200,
    message: 'Monthly rental report generated successfully.',
    data: result,
  });
});
