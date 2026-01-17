import { Router } from 'express';
import * as maintenanceController from '../controllers/maintenance.controller.js';
import { authenticate, authorizeMinRole } from '../middlewares/auth.js';
import { validateBody, validateParams } from '../middlewares/validate.js';
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  maintenanceIdSchema,
  startMaintenanceSchema,
  completeMaintenanceSchema,
} from '../validators/maintenance.validator.js';

const router = Router();

// All maintenance routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /maintenances:
 *   get:
 *     summary: Get all maintenances
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of maintenances
 */
router.get('/', maintenanceController.getMaintenances);

/**
 * @swagger
 * /maintenances/upcoming:
 *   get:
 *     summary: Get upcoming maintenances
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of upcoming maintenances
 */
router.get('/upcoming', maintenanceController.getUpcomingMaintenances);

/**
 * @swagger
 * /maintenances/overdue:
 *   get:
 *     summary: Get overdue maintenances
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of overdue maintenances
 */
router.get('/overdue', maintenanceController.getOverdueMaintenances);

/**
 * @swagger
 * /maintenances/statistics:
 *   get:
 *     summary: Get maintenance statistics
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance statistics
 */
router.get('/statistics', maintenanceController.getMaintenanceStatistics);

/**
 * @swagger
 * /maintenances/vehicle/{vehicleId}:
 *   get:
 *     summary: Get maintenance history for a vehicle
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicle maintenance history
 */
router.get(
  '/vehicle/:vehicleId',
  maintenanceController.getVehicleMaintenanceHistory
);

/**
 * @swagger
 * /maintenances:
 *   post:
 *     summary: Create a new maintenance
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *               - type
 *               - description
 *               - scheduledDate
 *             properties:
 *               vehicleId:
 *                 type: string
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               estimatedCost:
 *                 type: number
 *     responses:
 *       201:
 *         description: Maintenance created
 */
router.post(
  '/',
  authorizeMinRole('MANAGER'),
  validateBody(createMaintenanceSchema),
  maintenanceController.createMaintenance
);

/**
 * @swagger
 * /maintenances/{id}:
 *   get:
 *     summary: Get a maintenance by ID
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Maintenance details
 */
router.get(
  '/:id',
  validateParams(maintenanceIdSchema),
  maintenanceController.getMaintenanceById
);

/**
 * @swagger
 * /maintenances/{id}:
 *   patch:
 *     summary: Update a maintenance
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Maintenance updated
 */
router.patch(
  '/:id',
  authorizeMinRole('MANAGER'),
  validateParams(maintenanceIdSchema),
  validateBody(updateMaintenanceSchema),
  maintenanceController.updateMaintenance
);

/**
 * @swagger
 * /maintenances/{id}/start:
 *   post:
 *     summary: Start a maintenance
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mileageAtService:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Maintenance started
 */
router.post(
  '/:id/start',
  authorizeMinRole('MANAGER'),
  validateParams(maintenanceIdSchema),
  validateBody(startMaintenanceSchema),
  maintenanceController.startMaintenance
);

/**
 * @swagger
 * /maintenances/{id}/complete:
 *   post:
 *     summary: Complete a maintenance
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actualCost
 *             properties:
 *               actualCost:
 *                 type: number
 *               mileageAtService:
 *                 type: integer
 *               partsReplaced:
 *                 type: array
 *                 items:
 *                   type: string
 *               invoiceNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Maintenance completed
 */
router.post(
  '/:id/complete',
  authorizeMinRole('MANAGER'),
  validateParams(maintenanceIdSchema),
  validateBody(completeMaintenanceSchema),
  maintenanceController.completeMaintenance
);

/**
 * @swagger
 * /maintenances/{id}/cancel:
 *   post:
 *     summary: Cancel a maintenance
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Maintenance cancelled
 */
router.post(
  '/:id/cancel',
  authorizeMinRole('MANAGER'),
  validateParams(maintenanceIdSchema),
  maintenanceController.cancelMaintenance
);

export default router;
