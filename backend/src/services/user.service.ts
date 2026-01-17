import { Prisma, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors.js';
import {
  parsePaginationParams,
  createPaginatedResponse,
  calculateSkip,
  generateToken,
  hashToken,
} from '../utils/helpers.js';
import type { PaginatedResponse, SafeUser } from '../validators/index.js';
import { sendWelcomeEmail } from './email.service.js';
import type {
  CreateUserInput,
  UpdateUserInput,
  UserQueryInput,
} from '../validators/user.validator.js';

type UserWithRelations = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    firstName: true;
    lastName: true;
    phone: true;
    avatar: true;
    role: true;
    isActive: true;
    isEmailVerified: true;
    twoFactorEnabled: true;
    lastLoginAt: true;
    department: true;
    driverLicenseNumber: true;
    driverLicenseExpiry: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatar: true,
  role: true,
  isActive: true,
  isEmailVerified: true,
  twoFactorEnabled: true,
  lastLoginAt: true,
  department: true,
  driverLicenseNumber: true,
  driverLicenseExpiry: true,
  createdAt: true,
  updatedAt: true,
};

const SALT_ROUNDS = 12;

export async function createUser(
  data: CreateUserInput,
  creatorId: string
): Promise<UserWithRelations> {
  // Check for duplicate email
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    throw new ConflictError('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
  const emailVerificationToken = generateToken();

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role || 'EMPLOYEE',
      departmentId: data.departmentId,
      driverLicenseNumber: data.driverLicenseNumber,
      driverLicenseExpiry: data.driverLicenseExpiry
        ? new Date(data.driverLicenseExpiry)
        : null,
      emailVerificationToken: hashToken(emailVerificationToken),
    },
    select: userSelect,
  });

  // Create notification preferences
  await prisma.notificationPreference.create({
    data: { userId: user.id },
  });

  // Send welcome email
  await sendWelcomeEmail(user.email, user.firstName, emailVerificationToken);

  await prisma.auditLog.create({
    data: {
      userId: creatorId,
      action: 'CREATE',
      entityType: 'user',
      entityId: user.id,
      newValue: { email: user.email, role: user.role } as Prisma.InputJsonValue,
    },
  });

  logger.info(`User created: ${user.email} by ${creatorId}`);

  return user;
}

export async function getUsers(
  query: UserQueryInput
): Promise<PaginatedResponse<UserWithRelations>> {
  const pagination = parsePaginationParams(query);
  const skip = calculateSkip(pagination.page, pagination.limit);

  const where: Prisma.UserWhereInput = {};

  if (query.search) {
    where.OR = [
      { email: { contains: query.search, mode: 'insensitive' } },
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.role) {
    where.role = query.role;
  }

  if (query.departmentId) {
    where.departmentId = query.departmentId;
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  const orderBy: Prisma.UserOrderByWithRelationInput = {};
  if (pagination.sortBy) {
    orderBy[pagination.sortBy as keyof Prisma.UserOrderByWithRelationInput] =
      pagination.sortOrder;
  } else {
    orderBy.createdAt = 'desc';
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pagination.limit,
      orderBy,
      select: userSelect,
    }),
    prisma.user.count({ where }),
  ]);

  return createPaginatedResponse(users, total, pagination);
}

export async function getUserById(id: string): Promise<UserWithRelations> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

export async function updateUser(
  id: string,
  data: UpdateUserInput,
  updaterId: string
): Promise<UserWithRelations> {
  const existing = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!existing) {
    throw new NotFoundError('User not found');
  }

  // Check for duplicate email if changing
  if (data.email && data.email.toLowerCase() !== existing.email) {
    const duplicate = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (duplicate) {
      throw new ConflictError('Email already registered');
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...data,
      email: data.email?.toLowerCase(),
      driverLicenseExpiry: data.driverLicenseExpiry
        ? new Date(data.driverLicenseExpiry)
        : data.driverLicenseExpiry === null
        ? null
        : undefined,
    },
    select: userSelect,
  });

  await prisma.auditLog.create({
    data: {
      userId: updaterId,
      action: 'UPDATE',
      entityType: 'user',
      entityId: id,
      oldValue: existing as unknown as Prisma.InputJsonValue,
      newValue: data as Prisma.InputJsonValue,
    },
  });

  logger.info(`User updated: ${user.email} by ${updaterId}`);

  return user;
}

export async function updateUserRole(
  id: string,
  role: Role,
  updaterId: string
): Promise<UserWithRelations> {
  const existing = await prisma.user.findUnique({
    where: { id },
    select: { role: true, email: true },
  });

  if (!existing) {
    throw new NotFoundError('User not found');
  }

  // Prevent demoting the last super admin
  if (existing.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
    const superAdminCount = await prisma.user.count({
      where: { role: 'SUPER_ADMIN', isActive: true },
    });

    if (superAdminCount <= 1) {
      throw new BadRequestError('Cannot demote the last super admin');
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: userSelect,
  });

  await prisma.auditLog.create({
    data: {
      userId: updaterId,
      action: 'ROLE_CHANGE',
      entityType: 'user',
      entityId: id,
      oldValue: { role: existing.role } as Prisma.InputJsonValue,
      newValue: { role } as Prisma.InputJsonValue,
    },
  });

  logger.info(`User role changed: ${user.email} -> ${role} by ${updaterId}`);

  return user;
}

export async function toggleUserStatus(
  id: string,
  updaterId: string
): Promise<UserWithRelations> {
  const existing = await prisma.user.findUnique({
    where: { id },
    select: { isActive: true, email: true, role: true },
  });

  if (!existing) {
    throw new NotFoundError('User not found');
  }

  // Prevent deactivating the last super admin
  if (existing.role === 'SUPER_ADMIN' && existing.isActive) {
    const activeSuperAdmins = await prisma.user.count({
      where: { role: 'SUPER_ADMIN', isActive: true },
    });

    if (activeSuperAdmins <= 1) {
      throw new BadRequestError('Cannot deactivate the last super admin');
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: !existing.isActive },
    select: userSelect,
  });

  // If deactivating, invalidate all sessions
  if (!user.isActive) {
    await prisma.session.updateMany({
      where: { userId: id },
      data: { isValid: false },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: updaterId,
      action: 'STATUS_CHANGE',
      entityType: 'user',
      entityId: id,
      oldValue: { isActive: existing.isActive } as Prisma.InputJsonValue,
      newValue: { isActive: user.isActive } as Prisma.InputJsonValue,
    },
  });

  logger.info(
    `User ${user.isActive ? 'activated' : 'deactivated'}: ${user.email} by ${updaterId}`
  );

  return user;
}

export async function deleteUser(id: string, deleterId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true, role: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Prevent deleting the last super admin
  if (user.role === 'SUPER_ADMIN') {
    const superAdminCount = await prisma.user.count({
      where: { role: 'SUPER_ADMIN' },
    });

    if (superAdminCount <= 1) {
      throw new BadRequestError('Cannot delete the last super admin');
    }
  }

  // Check for active reservations
  const activeReservations = await prisma.reservation.count({
    where: {
      userId: id,
      status: { in: ['PENDING', 'APPROVED', 'IN_PROGRESS'] },
    },
  });

  if (activeReservations > 0) {
    throw new ConflictError('Cannot delete user with active reservations');
  }

  // Soft delete - just deactivate
  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  // Invalidate sessions
  await prisma.session.updateMany({
    where: { userId: id },
    data: { isValid: false },
  });

  await prisma.auditLog.create({
    data: {
      userId: deleterId,
      action: 'DELETE',
      entityType: 'user',
      entityId: id,
      oldValue: { email: user.email } as Prisma.InputJsonValue,
    },
  });

  logger.info(`User deleted: ${user.email} by ${deleterId}`);
}

export async function resetUserPassword(
  id: string,
  newPassword: string,
  resetById: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });

  // Invalidate all sessions
  await prisma.session.updateMany({
    where: { userId: id },
    data: { isValid: false },
  });

  await prisma.auditLog.create({
    data: {
      userId: resetById,
      action: 'PASSWORD_CHANGE',
      entityType: 'user',
      entityId: id,
      newValue: { resetBy: resetById } as Prisma.InputJsonValue,
    },
  });

  logger.info(`Password reset for user: ${user.email} by ${resetById}`);
}

export async function getProfile(userId: string): Promise<UserWithRelations & {
  reservationCount: number;
  completedReservations: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...userSelect,
      _count: {
        select: {
          reservations: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const completedReservations = await prisma.reservation.count({
    where: {
      userId,
      status: 'COMPLETED',
    },
  });

  const { _count, ...userData } = user;

  return {
    ...userData,
    reservationCount: _count.reservations,
    completedReservations,
  };
}

export async function updateProfile(
  userId: string,
  data: { firstName?: string; lastName?: string; phone?: string }
): Promise<UserWithRelations> {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: userSelect,
  });

  logger.info(`Profile updated: ${user.email}`);

  return user;
}

export async function updateAvatar(
  userId: string,
  avatarUrl: string
): Promise<UserWithRelations> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarUrl },
    select: userSelect,
  });

  return user;
}

export async function getDrivers(): Promise<UserWithRelations[]> {
  return prisma.user.findMany({
    where: {
      role: 'DRIVER',
      isActive: true,
    },
    select: userSelect,
    orderBy: { firstName: 'asc' },
  });
}

export async function getUserStatistics(userId: string): Promise<{
  totalReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  totalMileage: number;
  averageRating: number | null;
}> {
  const reservations = await prisma.reservation.findMany({
    where: { userId },
    select: {
      status: true,
      actualMileage: true,
      rating: true,
    },
  });

  const completed = reservations.filter((r) => r.status === 'COMPLETED');
  const cancelled = reservations.filter((r) => r.status === 'CANCELLED');

  const totalMileage = completed.reduce(
    (sum, r) => sum + (r.actualMileage || 0),
    0
  );

  const ratings = completed
    .map((r) => r.rating)
    .filter((r): r is number => r !== null);

  const averageRating =
    ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  return {
    totalReservations: reservations.length,
    completedReservations: completed.length,
    cancelledReservations: cancelled.length,
    totalMileage,
    averageRating,
  };
}
