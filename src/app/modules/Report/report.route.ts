import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { rentalReport } from './report.controller';

const router = Router();

router.use(auth);

router.get('/rentals', rentalReport);

export default router;
