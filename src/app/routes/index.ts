import { Router } from 'express';
import authRoutes from '../modules/Auth/auth.route';
import vehicleRoutes from '../modules/Vehicle/vehicle.route';
import rentalRoutes from '../modules/Rental/rental.route';
import reportRoutes from '../modules/Report/report.route';

const router = Router();

const moduleRoutes = [
  { path: '/auth', route: authRoutes },
  { path: '/vehicles', route: vehicleRoutes },
  { path: '/rentals', route: rentalRoutes },
  { path: '/reports', route: reportRoutes },
];

moduleRoutes.forEach(({ path, route }) => {
  router.use(path, route);
});

export default router;
