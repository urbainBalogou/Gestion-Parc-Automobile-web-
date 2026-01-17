import { z } from 'zod';
import { VehicleStatus, VehicleType, FuelType, TransmissionType } from '@prisma/client';

export const createVehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  type: z.nativeEnum(VehicleType),
  status: z.nativeEnum(VehicleStatus).optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
  transmission: z.nativeEnum(TransmissionType).optional(),
  seats: z.number().int().min(1).max(50).optional(),
  doors: z.number().int().min(1).max(10).optional(),
  color: z.string().optional(),
  engineCapacity: z.number().positive().optional(),
  horsePower: z.number().int().positive().optional(),
  currentMileage: z.number().int().min(0).optional(),
  fuelConsumption: z.number().positive().optional(),
  insuranceExpiry: z.string().datetime().optional(),
  technicalInspectionExpiry: z.string().datetime().optional(),
  locationId: z.string().uuid().optional(),
  acquisitionCost: z.number().positive().optional(),
  dailyRate: z.number().positive().optional(),
  mileageRate: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const vehicleQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
  type: z.nativeEnum(VehicleType).optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
  locationId: z.string().uuid().optional(),
  minSeats: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  maxSeats: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  availableFrom: z.string().datetime().optional(),
  availableTo: z.string().datetime().optional(),
});

export const vehicleIdSchema = z.object({
  id: z.string().uuid('Invalid vehicle ID'),
});

export const updateMileageSchema = z.object({
  mileage: z.number().int().min(0, 'Mileage must be positive'),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(VehicleStatus),
  reason: z.string().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleQueryInput = z.infer<typeof vehicleQuerySchema>;
