import { Router } from 'express';
import { fileUploader } from '../../../helpers/fileUploader';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { createVehicleSchema, updateVehicleSchema } from './vehicle.validation';
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from './vehicle.controller';

const router = Router();

router.use(auth);

router.get('/', getAllVehicles);
router.get('/:id', getVehicleById);
router.post('/', fileUploader.single('photo'), validateRequest(createVehicleSchema), createVehicle);
router.put(
  '/:id',
  fileUploader.single('photo'),
  validateRequest(updateVehicleSchema),
  updateVehicle,
);
router.delete('/:id', deleteVehicle);

export default router;
