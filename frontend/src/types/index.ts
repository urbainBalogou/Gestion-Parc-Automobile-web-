export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'DRIVER';

export type VehicleStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'IN_USE'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE';

export type VehicleType =
  | 'SEDAN'
  | 'SUV'
  | 'MINIVAN'
  | 'UTILITY'
  | 'PICKUP'
  | 'LUXURY'
  | 'MOTORCYCLE';

export type FuelType = 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'LPG';

export type TransmissionType = 'MANUAL' | 'AUTOMATIC';

export type ReservationStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type MaintenanceType =
  | 'ROUTINE_SERVICE'
  | 'REPAIR'
  | 'TECHNICAL_INSPECTION'
  | 'TIRE_CHANGE'
  | 'OIL_CHANGE'
  | 'BODY_REPAIR'
  | 'OTHER';

export type MaintenanceStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type NotificationType =
  | 'RESERVATION_CREATED'
  | 'RESERVATION_APPROVED'
  | 'RESERVATION_REJECTED'
  | 'RESERVATION_CANCELLED'
  | 'RESERVATION_REMINDER'
  | 'RESERVATION_STARTED'
  | 'RESERVATION_ENDED'
  | 'MAINTENANCE_SCHEDULED'
  | 'MAINTENANCE_DUE'
  | 'VEHICLE_AVAILABLE'
  | 'DOCUMENT_EXPIRING'
  | 'SYSTEM';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: Role;
  isActive: boolean;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  department?: Department;
  departmentId?: string;
  driverLicenseNumber?: string;
  driverLicenseExpiry?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  isActive: boolean;
}

export interface VehiclePhoto {
  id: string;
  url: string;
  isPrimary: boolean;
  caption?: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  brand: string;
  model: string;
  year: number;
  type: VehicleType;
  status: VehicleStatus;
  fuelType: FuelType;
  transmission: TransmissionType;
  seats: number;
  doors: number;
  color?: string;
  engineCapacity?: number;
  horsePower?: number;
  currentMileage: number;
  fuelConsumption?: number;
  insuranceExpiry?: string;
  technicalInspectionExpiry?: string;
  location?: Location;
  locationId?: string;
  photos: VehiclePhoto[];
  qrCode?: string;
  dailyRate?: number;
  mileageRate?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    reservations: number;
    maintenances: number;
  };
}

export interface Reservation {
  id: string;
  referenceNumber: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'department'>;
  userId: string;
  vehicle: Vehicle;
  vehicleId: string;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  purpose: string;
  destination: string;
  passengerCount: number;
  estimatedMileage?: number;
  actualMileage?: number;
  status: ReservationStatus;
  approvedBy?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  needsDriver: boolean;
  driver?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  driverId?: string;
  checkInMileage?: number;
  checkOutMileage?: number;
  checkInNotes?: string;
  checkOutNotes?: string;
  estimatedCost?: number;
  actualCost?: number;
  rating?: number;
  feedback?: string;
  notes?: string;
  department?: Department;
  createdAt: string;
  updatedAt: string;
}

export interface Maintenance {
  id: string;
  vehicle: Pick<Vehicle, 'id' | 'brand' | 'model' | 'registrationNumber'>;
  vehicleId: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  description: string;
  scheduledDate: string;
  startDate?: string;
  completedDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  mileageAtService?: number;
  partsReplaced: string[];
  providerName?: string;
  providerContact?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
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

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  requires2FA?: boolean;
}

export interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  activeReservations: number;
  pendingApprovals: number;
  monthlyReservations: number;
  utilizationRate: number;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}
