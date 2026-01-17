import { Response, NextFunction } from 'express';
import * as reservationService from '../../../../backend/src/services/reservation.service.js';
import type { AuthenticatedRequest } from '../validators/index.js';

export async function createReservation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reservation = await reservationService.createReservation(
      req.body,
      req.user!.id
    );

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

export async function getReservations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await reservationService.getReservations(
      req.query as Record<string, string>,
      req.user!.id,
      req.user!.role
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getReservationById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reservation = await reservationService.getReservationById(
      req.params.id,
      req.user!.id,
      req.user!.role
    );

    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateReservation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reservation = await reservationService.updateReservation(
      req.params.id,
      req.body,
      req.user!.id,
      req.user!.role
    );

    res.status(200).json({
      success: true,
      message: 'Reservation updated successfully',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

export async function approveReservation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reservation = await reservationService.approveReservation(
      req.params.id,
      req.user!.id,
      req.body.comment
    );

    res.status(200).json({
      success: true,
      message: 'Reservation approved successfully',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectReservation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reservation = await reservationService.rejectReservation(
      req.params.id,
      req.user!.id,
      req.body.reason
    );

    res.status(200).json({
      success: true,
      message: 'Reservation rejected',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelReservation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reservation = await reservationService.cancelReservation(
      req.params.id,
      req.user!.id,
      req.body.reason
    );

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

export async function checkIn(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reservation = await reservationService.checkIn(
      req.params.id,
      req.user!.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Check-in successful',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

export async function checkOut(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reservation = await reservationService.checkOut(
      req.params.id,
      req.user!.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Check-out successful',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUpcomingReservations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reservations = await reservationService.getUpcomingReservations(
      req.user!.id
    );

    res.status(200).json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
}

export async function getActiveReservations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId =
      req.user!.role === 'EMPLOYEE' || req.user!.role === 'DRIVER'
        ? req.user!.id
        : undefined;
    const reservations = await reservationService.getActiveReservations(userId);

    res.status(200).json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCalendarReservations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate, vehicleId } = req.query;
    const reservations = await reservationService.getCalendarReservations(
      new Date(startDate as string),
      new Date(endDate as string),
      vehicleId as string | undefined
    );

    res.status(200).json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
}
