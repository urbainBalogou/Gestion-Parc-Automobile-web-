import { Request } from 'express';
import { Role, User } from '@prisma/client';

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

export type SafeUser = Omit<
  User,
  | 'password'
  | 'emailVerificationToken'
  | 'passwordResetToken'
  | 'passwordResetExpires'
  | 'twoFactorSecret'
>;

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
