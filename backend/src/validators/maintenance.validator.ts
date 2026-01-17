import { z } from 'zod';
import { MaintenanceType, MaintenanceStatus } from '@prisma/client';

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  type: z.nativeEnum(MaintenanceType),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  scheduledDate: z.string().datetime('Invalid date'),
  estimatedCost: z.number().positive().optional(),
  providerName: z.string().optional(),
  providerContact: z.string().optional(),
  notes: z.string().optional(),
});

export const updateMaintenanceSchema = z.object({
  type: z.nativeEnum(MaintenanceType).optional(),
  description: z.string().min(10).optional(),
  scheduledDate: z.string().datetime().optional(),
  status: z.nativeEnum(MaintenanceStatus).optional(),
  startDate: z.string().datetime().optional(),
  completedDate: z.string().datetime().optional(),
  estimatedCost: z.number().positive().optional(),
  actualCost: z.number().positive().optional(),
  mileageAtService: z.number().int().positive().optional(),
  partsReplaced: z.array(z.string()).optional(),
  providerName: z.string().optional(),
  providerContact: z.string().optional(),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const maintenanceQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  vehicleId: z.string().uuid().optional(),
  type: z.nativeEnum(MaintenanceType).optional(),
  status: z.nativeEnum(MaintenanceStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const maintenanceIdSchema = z.object({
  id: z.string().uuid('Invalid maintenance ID'),
});

export const startMaintenanceSchema = z.object({
  mileageAtService: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export const completeMaintenanceSchema = z.object({
  actualCost: z.number().positive(),
  mileageAtService: z.number().int().positive().optional(),
  partsReplaced: z.array(z.string()).optional(),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type MaintenanceQueryInput = z.infer<typeof maintenanceQuerySchema>;
