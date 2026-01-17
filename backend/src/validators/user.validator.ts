import { z } from 'zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  departmentId: z.string().uuid().optional(),
  driverLicenseNumber: z.string().optional(),
  driverLicenseExpiry: z.string().datetime().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  departmentId: z.string().uuid().optional().nullable(),
  driverLicenseNumber: z.string().optional().nullable(),
  driverLicenseExpiry: z.string().datetime().optional().nullable(),
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export const userQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  departmentId: z.string().uuid().optional(),
  isActive: z.string().optional().transform(val => val === 'true'),
});

export const userIdSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
});

export const updateNotificationPreferencesSchema = z.object({
  inAppReservation: z.boolean().optional(),
  inAppApproval: z.boolean().optional(),
  inAppReminder: z.boolean().optional(),
  inAppMaintenance: z.boolean().optional(),
  inAppSystem: z.boolean().optional(),
  emailReservation: z.boolean().optional(),
  emailApproval: z.boolean().optional(),
  emailReminder: z.boolean().optional(),
  emailMaintenance: z.boolean().optional(),
  emailSystem: z.boolean().optional(),
  reminderBefore: z.number().int().min(1).max(72).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
