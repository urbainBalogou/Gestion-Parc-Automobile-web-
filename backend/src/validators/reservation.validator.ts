import { z } from 'zod';
import { ReservationStatus } from '@prisma/client';

export const createReservationSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
  destination: z.string().min(3, 'Destination is required'),
  passengerCount: z.number().int().min(1).max(50).optional(),
  estimatedMileage: z.number().int().positive().optional(),
  needsDriver: z.boolean().optional(),
  driverId: z.string().uuid().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.string().optional(),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

export const updateReservationSchema = z.object({
  vehicleId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  purpose: z.string().min(10).optional(),
  destination: z.string().min(3).optional(),
  passengerCount: z.number().int().min(1).max(50).optional(),
  estimatedMileage: z.number().int().positive().optional(),
  needsDriver: z.boolean().optional(),
  driverId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const reservationQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.nativeEnum(ReservationStatus).optional(),
  vehicleId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
});

export const reservationIdSchema = z.object({
  id: z.string().uuid('Invalid reservation ID'),
});

export const approveReservationSchema = z.object({
  comment: z.string().optional(),
});

export const rejectReservationSchema = z.object({
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
});

export const checkInSchema = z.object({
  mileage: z.number().int().min(0),
  notes: z.string().optional(),
});

export const checkOutSchema = z.object({
  mileage: z.number().int().min(0),
  notes: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().optional(),
});

export const cancelReservationSchema = z.object({
  reason: z.string().min(5, 'Cancellation reason is required'),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
export type ReservationQueryInput = z.infer<typeof reservationQuerySchema>;
export type ApproveReservationInput = z.infer<typeof approveReservationSchema>;
export type RejectReservationInput = z.infer<typeof rejectReservationSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
