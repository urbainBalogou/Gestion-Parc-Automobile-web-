import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate, authorizeMinRole } from '../middlewares/auth.js';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics (admin)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get(
  '/stats',
  authorizeMinRole('MANAGER'),
  dashboardController.getDashboardStats
);

/**
 * @swagger
 * /dashboard/user:
 *   get:
 *     summary: Get user dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User dashboard data
 */
router.get('/user', dashboardController.getUserDashboard);

/**
 * @swagger
 * /dashboard/reservation-trends:
 *   get:
 *     summary: Get reservation trends
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reservation trends data
 */
router.get(
  '/reservation-trends',
  authorizeMinRole('MANAGER'),
  dashboardController.getReservationTrends
);

/**
 * @swagger
 * /dashboard/vehicle-utilization:
 *   get:
 *     summary: Get vehicle utilization data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle utilization data
 */
router.get(
  '/vehicle-utilization',
  authorizeMinRole('MANAGER'),
  dashboardController.getVehicleUtilization
);

/**
 * @swagger
 * /dashboard/reservations-by-status:
 *   get:
 *     summary: Get reservations grouped by status
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reservations by status
 */
router.get(
  '/reservations-by-status',
  authorizeMinRole('MANAGER'),
  dashboardController.getReservationsByStatus
);

/**
 * @swagger
 * /dashboard/reservations-by-department:
 *   get:
 *     summary: Get reservations grouped by department
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reservations by department
 */
router.get(
  '/reservations-by-department',
  authorizeMinRole('MANAGER'),
  dashboardController.getReservationsByDepartment
);

/**
 * @swagger
 * /dashboard/vehicles-by-type:
 *   get:
 *     summary: Get vehicles grouped by type
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicles by type
 */
router.get(
  '/vehicles-by-type',
  authorizeMinRole('MANAGER'),
  dashboardController.getVehiclesByType
);

/**
 * @swagger
 * /dashboard/vehicles-by-status:
 *   get:
 *     summary: Get vehicles grouped by status
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicles by status
 */
router.get(
  '/vehicles-by-status',
  authorizeMinRole('MANAGER'),
  dashboardController.getVehiclesByStatus
);

/**
 * @swagger
 * /dashboard/top-users:
 *   get:
 *     summary: Get top users by reservations
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Top users
 */
router.get(
  '/top-users',
  authorizeMinRole('MANAGER'),
  dashboardController.getTopUsers
);

/**
 * @swagger
 * /dashboard/monthly-stats:
 *   get:
 *     summary: Get monthly statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Monthly statistics
 */
router.get(
  '/monthly-stats',
  authorizeMinRole('MANAGER'),
  dashboardController.getMonthlyStats
);

/**
 * @swagger
 * /dashboard/maintenance-overview:
 *   get:
 *     summary: Get maintenance overview
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance overview
 */
router.get(
  '/maintenance-overview',
  authorizeMinRole('MANAGER'),
  dashboardController.getMaintenanceOverview
);

/**
 * @swagger
 * /dashboard/recent-activity:
 *   get:
 *     summary: Get recent activity
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recent activity
 */
router.get(
  '/recent-activity',
  authorizeMinRole('MANAGER'),
  dashboardController.getRecentActivity
);

/**
 * @swagger
 * /dashboard/expiring-documents:
 *   get:
 *     summary: Get expiring documents
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Expiring documents
 */
router.get(
  '/expiring-documents',
  authorizeMinRole('MANAGER'),
  dashboardController.getExpiringDocuments
);

export default router;
