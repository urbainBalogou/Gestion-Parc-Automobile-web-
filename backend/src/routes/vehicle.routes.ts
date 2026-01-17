import { Router } from 'express';
import * as vehicleController from '../controllers/vehicle.controller.js';
import { authenticate, authorize, authorizeMinRole } from '../middlewares/auth.js';
import { validateBody, validateParams } from '../middlewares/validate.js';
import { uploadImage } from '../middlewares/upload.js';
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdSchema,
  updateStatusSchema,
  updateMileageSchema,
} from '../validators/vehicle.validator.js';

const router = Router();

// All vehicle routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Get all vehicles
 *     tags: [Vehicles]
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
 *         name: search
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
 *         description: List of vehicles
 */
router.get('/', vehicleController.getVehicles);

/**
 * @swagger
 * /vehicles/available:
 *   get:
 *     summary: Get available vehicles for a date range
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of available vehicles
 */
router.get('/available', vehicleController.getAvailableVehicles);

/**
 * @swagger
 * /vehicles/favorites:
 *   get:
 *     summary: Get user's favorite vehicles
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite vehicles
 */
router.get('/favorites', vehicleController.getFavorites);

/**
 * @swagger
 * /vehicles:
 *   post:
 *     summary: Create a new vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Vehicle created
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/',
  authorizeMinRole('ADMIN'),
  validateBody(createVehicleSchema),
  vehicleController.createVehicle
);

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Get a vehicle by ID
 *     tags: [Vehicles]
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
 *         description: Vehicle details
 *       404:
 *         description: Vehicle not found
 */
router.get(
  '/:id',
  validateParams(vehicleIdSchema),
  vehicleController.getVehicleById
);

/**
 * @swagger
 * /vehicles/{id}:
 *   patch:
 *     summary: Update a vehicle
 *     tags: [Vehicles]
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
 *         description: Vehicle updated
 */
router.patch(
  '/:id',
  authorizeMinRole('ADMIN'),
  validateParams(vehicleIdSchema),
  validateBody(updateVehicleSchema),
  vehicleController.updateVehicle
);

/**
 * @swagger
 * /vehicles/{id}:
 *   delete:
 *     summary: Delete a vehicle
 *     tags: [Vehicles]
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
 *         description: Vehicle deleted
 */
router.delete(
  '/:id',
  authorizeMinRole('ADMIN'),
  validateParams(vehicleIdSchema),
  vehicleController.deleteVehicle
);

/**
 * @swagger
 * /vehicles/{id}/status:
 *   patch:
 *     summary: Update vehicle status
 *     tags: [Vehicles]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  '/:id/status',
  authorizeMinRole('MANAGER'),
  validateParams(vehicleIdSchema),
  validateBody(updateStatusSchema),
  vehicleController.updateVehicleStatus
);

/**
 * @swagger
 * /vehicles/{id}/mileage:
 *   patch:
 *     summary: Update vehicle mileage
 *     tags: [Vehicles]
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
 *               - mileage
 *             properties:
 *               mileage:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Mileage updated
 */
router.patch(
  '/:id/mileage',
  authorizeMinRole('MANAGER'),
  validateParams(vehicleIdSchema),
  validateBody(updateMileageSchema),
  vehicleController.updateVehicleMileage
);

/**
 * @swagger
 * /vehicles/{id}/statistics:
 *   get:
 *     summary: Get vehicle statistics
 *     tags: [Vehicles]
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
 *         description: Vehicle statistics
 */
router.get(
  '/:id/statistics',
  validateParams(vehicleIdSchema),
  vehicleController.getVehicleStatistics
);

/**
 * @swagger
 * /vehicles/{id}/photos:
 *   post:
 *     summary: Add a photo to vehicle
 *     tags: [Vehicles]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *               isPrimary:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Photo added
 */
router.post(
  '/:id/photos',
  authorizeMinRole('ADMIN'),
  validateParams(vehicleIdSchema),
  uploadImage.single('photo'),
  vehicleController.addPhoto
);

/**
 * @swagger
 * /vehicles/{id}/photos/{photoId}:
 *   delete:
 *     summary: Remove a photo from vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Photo removed
 */
router.delete(
  '/:id/photos/:photoId',
  authorizeMinRole('ADMIN'),
  vehicleController.removePhoto
);

/**
 * @swagger
 * /vehicles/{id}/favorite:
 *   post:
 *     summary: Toggle vehicle as favorite
 *     tags: [Vehicles]
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
 *         description: Favorite toggled
 */
router.post(
  '/:id/favorite',
  validateParams(vehicleIdSchema),
  vehicleController.toggleFavorite
);

export default router;
