import { Role, User } from '@prisma/client';
import { Request } from 'express';

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// Authenticated Request
export interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: string;
  userRole?: Role;
}

// Pagination
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

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

// Vehicle Filters
export interface VehicleFilters {
  status?: string;
  type?: string;
  fuelType?: string;
  transmission?: string;
  locationId?: string;
  minSeats?: number;
  maxSeats?: number;
  search?: string;
  available?: boolean;
  startDate?: Date;
  endDate?: Date;
}

// Reservation Filters
export interface ReservationFilters {
  status?: string;
  userId?: string;
  vehicleId?: string;
  driverId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

// User Filters
export interface UserFilters {
  role?: string;
  departmentId?: string;
  isActive?: boolean;
  search?: string;
}

// Maintenance Filters
export interface MaintenanceFilters {
  status?: string;
  type?: string;
  priority?: string;
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
}

// Dashboard Stats
export interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  reservedVehicles: number;
  inUseVehicles: number;
  maintenanceVehicles: number;
  totalReservations: number;
  pendingReservations: number;
  activeReservations: number;
  totalUsers: number;
  upcomingMaintenance: number;
}

// Chart Data
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// Email Options
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// 2FA
export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes?: string[];
}

// Token Response
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Login Response
export interface LoginResponse extends TokenResponse {
  user: Omit<User, 'password' | 'twoFactorSecret' | 'passwordResetToken'>;
  requiresTwoFactor?: boolean;
}
