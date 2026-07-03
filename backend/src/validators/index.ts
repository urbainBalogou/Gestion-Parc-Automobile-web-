import { Request } from 'express';
import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  type: 'access' | 'refresh';
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    firstName: string;
    lastName: string;
  };
}

export interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  role: Role;
  isActive: boolean;
  isEmailVerified?: boolean;
  twoFactorEnabled: boolean;
  departmentId?: string | null;
  lastLoginAt?: Date | null;
  passwordChangedAt?: Date | null;
  driverLicenseNumber?: string | null;
  driverLicenseExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface FilterParams {
  search?: string;
  status?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  [key: string]: unknown;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface StatisticsData {
  label: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}
