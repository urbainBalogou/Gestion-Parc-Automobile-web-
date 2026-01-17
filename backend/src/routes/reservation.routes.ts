import { Router } from 'express';
import * as reservationController from '../controllers/reservation.controller.js';
import { authenticate, authorizeMinRole } from '../middlewares/auth.js';
import { validateBody, validateParams } from '../middlewares/validate.js';
import {
  createReservationSchema,
  updateReservationSchema,
  reservationIdSchema,
  approveReservationSchema,
  rejectReservationSchema,
  checkInSchema,
  checkOutSchema,
  cancelReservationSchema,
} from '../validators/reservation.validator.js';

const router = Router();

// All reservation routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: Get all reservations
 *     tags: [Reservations]
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
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reservations
 */
router.get('/', reservationController.getReservations);

/**
 * @swagger
 * /reservations/upcoming:
 *   get:
 *     summary: Get upcoming reservations for current user
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of upcoming reservations
 */
router.get('/upcoming', reservationController.getUpcomingReservations);

/**
 * @swagger
 * /reservations/active:
 *   get:
 *     summary: Get active (in-progress) reservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active reservations
 */
router.get('/active', reservationController.getActiveReservations);

/**
 * @swagger
 * /reservations/calendar:
 *   get:
 *     summary: Get reservations for calendar view
 *     tags: [Reservations]
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
 *         name: vehicleId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Calendar reservations
 */
router.get('/calendar', reservationController.getCalendarReservations);

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
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
 *               - startDate
 *               - endDate
 *               - purpose
 *               - destination
 *             properties:
 *               vehicleId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               purpose:
 *                 type: string
 *               destination:
 *                 type: string
 *               passengerCount:
 *                 type: integer
 *               estimatedMileage:
 *                 type: integer
 *               needsDriver:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Reservation created
 */
router.post(
  '/',
  validateBody(createReservationSchema),
  reservationController.createReservation
);

/**
 * @swagger
 * /reservations/{id}:
 *   get:
 *     summary: Get a reservation by ID
 *     tags: [Reservations]
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
 *         description: Reservation details
 *       404:
 *         description: Reservation not found
 */
router.get(
  '/:id',
  validateParams(reservationIdSchema),
  reservationController.getReservationById
);

/**
 * @swagger
 * /reservations/{id}:
 *   patch:
 *     summary: Update a reservation
 *     tags: [Reservations]
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
 *         description: Reservation updated
 */
router.patch(
  '/:id',
  validateParams(reservationIdSchema),
  validateBody(updateReservationSchema),
  reservationController.updateReservation
);

/**
 * @swagger
 * /reservations/{id}/approve:
 *   post:
 *     summary: Approve a reservation
 *     tags: [Reservations]
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
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reservation approved
 */
router.post(
  '/:id/approve',
  authorizeMinRole('MANAGER'),
  validateParams(reservationIdSchema),
  validateBody(approveReservationSchema),
  reservationController.approveReservation
);

/**
 * @swagger
 * /reservations/{id}/reject:
 *   post:
 *     summary: Reject a reservation
 *     tags: [Reservations]
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reservation rejected
 */
router.post(
  '/:id/reject',
  authorizeMinRole('MANAGER'),
  validateParams(reservationIdSchema),
  validateBody(rejectReservationSchema),
  reservationController.rejectReservation
);

/**
 * @swagger
 * /reservations/{id}/cancel:
 *   post:
 *     summary: Cancel a reservation
 *     tags: [Reservations]
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reservation cancelled
 */
router.post(
  '/:id/cancel',
  validateParams(reservationIdSchema),
  validateBody(cancelReservationSchema),
  reservationController.cancelReservation
);

/**
 * @swagger
 * /reservations/{id}/check-in:
 *   post:
 *     summary: Check in a reservation
 *     tags: [Reservations]
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
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check-in successful
 */
router.post(
  '/:id/check-in',
  authorizeMinRole('MANAGER'),
  validateParams(reservationIdSchema),
  validateBody(checkInSchema),
  reservationController.checkIn
);

/**
 * @swagger
 * /reservations/{id}/check-out:
 *   post:
 *     summary: Check out a reservation
 *     tags: [Reservations]
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
 *               notes:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check-out successful
 */
router.post(
  '/:id/check-out',
  authorizeMinRole('MANAGER'),
  validateParams(reservationIdSchema),
  validateBody(checkOutSchema),
  reservationController.checkOut
);

export default router;
