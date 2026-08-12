import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { createRentalSchema, updateRentalSchema } from './rental.validation';
import {
  getAllRentals,
  getRentalById,
  createRental,
  updateRental,
  deleteRental,
} from './rental.controller';

const router = Router();

router.use(auth);

router.get('/', getAllRentals);
router.get('/:id', getRentalById);
router.post('/', validateRequest(createRentalSchema), createRental);
router.put('/:id', validateRequest(updateRentalSchema), updateRental);
router.delete('/:id', deleteRental);

export default router;
