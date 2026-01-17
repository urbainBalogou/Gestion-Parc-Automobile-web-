import { Prisma, ReservationStatus, Role } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  ForbiddenError,
} from '../utils/errors.js';
import {
  parsePaginationParams,
  createPaginatedResponse,
  calculateSkip,
  generateReferenceNumber,
  doDateRangesOverlap,
  calculateDurationInHours,
} from '../utils/helpers.js';
import type { PaginatedResponse } from '../validators/index.js';
import {
  sendReservationConfirmationEmail,
  sendReservationStatusEmail,
} from './email.service.js';
import { createNotification } from './notification.service.js';
import type {
  CreateReservationInput,
  UpdateReservationInput,
  ReservationQueryInput,
  CheckInInput,
  CheckOutInput,
} from '../validators/reservation.validator.js';

type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
        department: true;
      };
    };
    vehicle: {
      include: { photos: true };
    };
    driver: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
      };
    };
    approvedBy: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
      };
    };
  };
}>;

const reservationInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      department: true,
    },
  },
  vehicle: {
    include: { photos: true },
  },
  driver: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  approvedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
};

async function checkVehicleAvailability(
  vehicleId: string,
  startDate: Date,
  endDate: Date,
  excludeReservationId?: string
): Promise<boolean> {
  const conflicting = await prisma.reservation.findFirst({
    where: {
      vehicleId,
      status: { in: ['PENDING', 'APPROVED', 'IN_PROGRESS'] },
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      OR: [
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ],
    },
  });

  return !conflicting;
}

async function addHistoryEntry(
  reservationId: string,
  previousStatus: ReservationStatus | null,
  newStatus: ReservationStatus,
  changedBy: string,
  comment?: string
): Promise<void> {
  await prisma.reservationHistory.create({
    data: {
      reservationId,
      previousStatus,
      newStatus,
      changedBy,
      comment,
    },
  });
}

export async function createReservation(
  data: CreateReservationInput,
  userId: string
): Promise<ReservationWithRelations> {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  // Validate dates
  if (startDate < new Date()) {
    throw new BadRequestError('Start date cannot be in the past');
  }

  // Check vehicle exists and is available
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: data.vehicleId },
    include: { photos: true },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  if (vehicle.status !== 'AVAILABLE') {
    throw new ConflictError(`Vehicle is currently ${vehicle.status.toLowerCase()}`);
  }

  // Check for conflicting reservations
  const isAvailable = await checkVehicleAvailability(
    data.vehicleId,
    startDate,
    endDate
  );

  if (!isAvailable) {
    throw new ConflictError('Vehicle is not available for the selected dates');
  }

  // Get user for department
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { departmentId: true, email: true, firstName: true },
  });

  // Calculate estimated cost
  const hours = calculateDurationInHours(startDate, endDate);
  const days = Math.ceil(hours / 24);
  const estimatedCost = vehicle.dailyRate ? vehicle.dailyRate * days : null;

  const reservation = await prisma.reservation.create({
    data: {
      referenceNumber: generateReferenceNumber(),
      userId,
      vehicleId: data.vehicleId,
      startDate,
      endDate,
      purpose: data.purpose,
      destination: data.destination,
      passengerCount: data.passengerCount || 1,
      estimatedMileage: data.estimatedMileage,
      needsDriver: data.needsDriver || false,
      driverId: data.driverId,
      notes: data.notes,
      isRecurring: data.isRecurring || false,
      recurringPattern: data.recurringPattern,
      departmentId: user?.departmentId,
      estimatedCost,
      status: 'PENDING',
    },
    include: reservationInclude,
  });

  // Add history entry
  await addHistoryEntry(
    reservation.id,
    null,
    'PENDING',
    userId,
    'Reservation created'
  );

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CREATE',
      entityType: 'reservation',
      entityId: reservation.id,
      newValue: { referenceNumber: reservation.referenceNumber } as Prisma.InputJsonValue,
    },
  });

  // Send confirmation email
  if (user) {
    await sendReservationConfirmationEmail(user.email, user.firstName, {
      referenceNumber: reservation.referenceNumber,
      vehicleName: `${vehicle.brand} ${vehicle.model}`,
      startDate,
      endDate,
      destination: data.destination,
    });
  }

  // Notify managers for approval
  const managers = await prisma.user.findMany({
    where: { role: { in: ['MANAGER', 'ADMIN', 'SUPER_ADMIN'] }, isActive: true },
    select: { id: true },
  });

  for (const manager of managers) {
    await createNotification({
      userId: manager.id,
      type: 'RESERVATION_CREATED',
      title: 'New Reservation Request',
      message: `New reservation request ${reservation.referenceNumber} requires approval`,
      entityType: 'reservation',
      entityId: reservation.id,
    });
  }

  logger.info(`Reservation created: ${reservation.referenceNumber}`);

  return reservation;
}

export async function getReservations(
  query: ReservationQueryInput,
  userId?: string,
  userRole?: Role
): Promise<PaginatedResponse<ReservationWithRelations>> {
  const pagination = parsePaginationParams(query);
  const skip = calculateSkip(pagination.page, pagination.limit);

  const where: Prisma.ReservationWhereInput = {};

  // Regular employees can only see their own reservations
  if (userRole === 'EMPLOYEE' && userId) {
    where.userId = userId;
  } else if (userRole === 'DRIVER' && userId) {
    where.OR = [{ userId }, { driverId: userId }];
  } else if (query.userId) {
    where.userId = query.userId;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.vehicleId) {
    where.vehicleId = query.vehicleId;
  }

  if (query.startDate && query.endDate) {
    where.AND = [
      { startDate: { gte: new Date(query.startDate) } },
      { endDate: { lte: new Date(query.endDate) } },
    ];
  } else if (query.startDate) {
    where.startDate = { gte: new Date(query.startDate) };
  } else if (query.endDate) {
    where.endDate = { lte: new Date(query.endDate) };
  }

  if (query.search) {
    where.OR = [
      { referenceNumber: { contains: query.search, mode: 'insensitive' } },
      { purpose: { contains: query.search, mode: 'insensitive' } },
      { destination: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const orderBy: Prisma.ReservationOrderByWithRelationInput = {};
  if (pagination.sortBy) {
    orderBy[pagination.sortBy as keyof Prisma.ReservationOrderByWithRelationInput] =
      pagination.sortOrder;
  } else {
    orderBy.createdAt = 'desc';
  }

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      skip,
      take: pagination.limit,
      orderBy,
      include: reservationInclude,
    }),
    prisma.reservation.count({ where }),
  ]);

  return createPaginatedResponse(reservations, total, pagination);
}

export async function getReservationById(
  id: string,
  userId?: string,
  userRole?: Role
): Promise<ReservationWithRelations> {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      ...reservationInclude,
      history: {
        orderBy: { createdAt: 'desc' },
      },
      documents: true,
    },
  });

  if (!reservation) {
    throw new NotFoundError('Reservation not found');
  }

  // Check access
  if (userRole === 'EMPLOYEE' && reservation.userId !== userId) {
    throw new ForbiddenError('You can only view your own reservations');
  }

  if (
    userRole === 'DRIVER' &&
    reservation.userId !== userId &&
    reservation.driverId !== userId
  ) {
    throw new ForbiddenError('Access denied');
  }

  return reservation;
}

export async function updateReservation(
  id: string,
  data: UpdateReservationInput,
  userId: string,
  userRole: Role
): Promise<ReservationWithRelations> {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
  });

  if (!reservation) {
    throw new NotFoundError('Reservation not found');
  }

  // Check permissions
  if (userRole === 'EMPLOYEE' && reservation.userId !== userId) {
    throw new ForbiddenError('You can only modify your own reservations');
  }

  // Can only modify draft or pending reservations
  if (!['DRAFT', 'PENDING'].includes(reservation.status)) {
    throw new ConflictError(
      'Cannot modify reservation that is already approved or in progress'
    );
  }

  const startDate = data.startDate ? new Date(data.startDate) : reservation.startDate;
  const endDate = data.endDate ? new Date(data.endDate) : reservation.endDate;

  // Check vehicle availability if dates or vehicle changed
  if (data.vehicleId || data.startDate || data.endDate) {
    const vehicleId = data.vehicleId || reservation.vehicleId;
    const isAvailable = await checkVehicleAvailability(
      vehicleId,
      startDate,
      endDate,
      id
    );

    if (!isAvailable) {
      throw new ConflictError('Vehicle is not available for the selected dates');
    }
  }

  // If modified, reset to pending
  const newStatus =
    reservation.status === 'DRAFT' ? 'DRAFT' : 'PENDING';

  const updated = await prisma.reservation.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      status: newStatus,
    },
    include: reservationInclude,
  });

  await addHistoryEntry(
    id,
    reservation.status,
    newStatus,
    userId,
    'Reservation updated'
  );

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE',
      entityType: 'reservation',
      entityId: id,
      oldValue: reservation as unknown as Prisma.InputJsonValue,
      newValue: data as Prisma.InputJsonValue,
    },
  });

  logger.info(`Reservation updated: ${reservation.referenceNumber}`);

  return updated;
}

export async function approveReservation(
  id: string,
  approverId: string,
  comment?: string
): Promise<ReservationWithRelations> {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, firstName: true } },
    },
  });

  if (!reservation) {
    throw new NotFoundError('Reservation not found');
  }

  if (reservation.status !== 'PENDING') {
    throw new ConflictError('Only pending reservations can be approved');
  }

  // Double-check vehicle availability
  const isAvailable = await checkVehicleAvailability(
    reservation.vehicleId,
    reservation.startDate,
    reservation.endDate,
    id
  );

  if (!isAvailable) {
    throw new ConflictError('Vehicle is no longer available');
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedById: approverId,
      approvedAt: new Date(),
    },
    include: reservationInclude,
  });

  await addHistoryEntry(id, 'PENDING', 'APPROVED', approverId, comment);

  // Notify user
  await createNotification({
    userId: reservation.userId,
    type: 'RESERVATION_APPROVED',
    title: 'Reservation Approved',
    message: `Your reservation ${reservation.referenceNumber} has been approved`,
    entityType: 'reservation',
    entityId: id,
  });

  // Send email
  await sendReservationStatusEmail(
    reservation.user.email,
    reservation.user.firstName,
    {
      referenceNumber: reservation.referenceNumber,
      status: 'APPROVED',
    }
  );

  await prisma.auditLog.create({
    data: {
      userId: approverId,
      action: 'APPROVAL',
      entityType: 'reservation',
      entityId: id,
      newValue: { status: 'APPROVED', comment } as Prisma.InputJsonValue,
    },
  });

  logger.info(`Reservation approved: ${reservation.referenceNumber}`);

  return updated;
}

export async function rejectReservation(
  id: string,
  approverId: string,
  reason: string
): Promise<ReservationWithRelations> {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, firstName: true } },
    },
  });

  if (!reservation) {
    throw new NotFoundError('Reservation not found');
  }

  if (reservation.status !== 'PENDING') {
    throw new ConflictError('Only pending reservations can be rejected');
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: {
      status: 'REJECTED',
      approvedById: approverId,
      approvedAt: new Date(),
      rejectionReason: reason,
    },
    include: reservationInclude,
  });

  await addHistoryEntry(id, 'PENDING', 'REJECTED', approverId, reason);

  // Notify user
  await createNotification({
    userId: reservation.userId,
    type: 'RESERVATION_REJECTED',
    title: 'Reservation Rejected',
    message: `Your reservation ${reservation.referenceNumber} has been rejected: ${reason}`,
    entityType: 'reservation',
    entityId: id,
  });

  // Send email
  await sendReservationStatusEmail(
    reservation.user.email,
    reservation.user.firstName,
    {
      referenceNumber: reservation.referenceNumber,
      status: 'REJECTED',
      reason,
    }
  );

  await prisma.auditLog.create({
    data: {
      userId: approverId,
      action: 'REJECTION',
      entityType: 'reservation',
      entityId: id,
      newValue: { status: 'REJECTED', reason } as Prisma.InputJsonValue,
    },
  });

  logger.info(`Reservation rejected: ${reservation.referenceNumber}`);

  return updated;
}

export async function cancelReservation(
  id: string,
  userId: string,
  reason: string
): Promise<ReservationWithRelations> {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
  });

  if (!reservation) {
    throw new NotFoundError('Reservation not found');
  }

  if (['COMPLETED', 'CANCELLED'].includes(reservation.status)) {
    throw new ConflictError('Reservation cannot be cancelled');
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      notes: reason,
    },
    include: reservationInclude,
  });

  await addHistoryEntry(id, reservation.status, 'CANCELLED', userId, reason);

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'STATUS_CHANGE',
      entityType: 'reservation',
      entityId: id,
      oldValue: { status: reservation.status } as Prisma.InputJsonValue,
      newValue: { status: 'CANCELLED', reason } as Prisma.InputJsonValue,
    },
  });

  logger.info(`Reservation cancelled: ${reservation.referenceNumber}`);

  return updated;
}

export async function checkIn(
  id: string,
  userId: string,
  data: CheckInInput
): Promise<ReservationWithRelations> {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { vehicle: true },
  });

  if (!reservation) {
    throw new NotFoundError('Reservation not found');
  }

  if (reservation.status !== 'APPROVED') {
    throw new ConflictError('Only approved reservations can be checked in');
  }

  // Update reservation
  const updated = await prisma.reservation.update({
    where: { id },
    data: {
      status: 'IN_PROGRESS',
      actualStartDate: new Date(),
      checkInMileage: data.mileage,
      checkInNotes: data.notes,
    },
    include: reservationInclude,
  });

  // Update vehicle status
  await prisma.vehicle.update({
    where: { id: reservation.vehicleId },
    data: { status: 'IN_USE' },
  });

  await addHistoryEntry(
    id,
    'APPROVED',
    'IN_PROGRESS',
    userId,
    `Check-in at ${data.mileage} km`
  );

  await createNotification({
    userId: reservation.userId,
    type: 'RESERVATION_STARTED',
    title: 'Reservation Started',
    message: `Your reservation ${reservation.referenceNumber} has started`,
    entityType: 'reservation',
    entityId: id,
  });

  logger.info(`Reservation checked in: ${reservation.referenceNumber}`);

  return updated;
}

export async function checkOut(
  id: string,
  userId: string,
  data: CheckOutInput
): Promise<ReservationWithRelations> {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { vehicle: true },
  });

  if (!reservation) {
    throw new NotFoundError('Reservation not found');
  }

  if (reservation.status !== 'IN_PROGRESS') {
    throw new ConflictError('Only in-progress reservations can be checked out');
  }

  if (data.mileage < (reservation.checkInMileage || 0)) {
    throw new BadRequestError('Check-out mileage cannot be less than check-in');
  }

  const actualMileage = data.mileage - (reservation.checkInMileage || 0);

  // Calculate actual cost
  const hours = calculateDurationInHours(
    reservation.actualStartDate || reservation.startDate,
    new Date()
  );
  const days = Math.ceil(hours / 24);
  const dailyCost = reservation.vehicle.dailyRate
    ? reservation.vehicle.dailyRate * days
    : 0;
  const mileageCost = reservation.vehicle.mileageRate
    ? reservation.vehicle.mileageRate * actualMileage
    : 0;
  const actualCost = dailyCost + mileageCost;

  // Update reservation
  const updated = await prisma.reservation.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      actualEndDate: new Date(),
      checkOutMileage: data.mileage,
      checkOutNotes: data.notes,
      actualMileage,
      actualCost,
      rating: data.rating,
      feedback: data.feedback,
    },
    include: reservationInclude,
  });

  // Update vehicle
  await prisma.vehicle.update({
    where: { id: reservation.vehicleId },
    data: {
      status: 'AVAILABLE',
      currentMileage: data.mileage,
    },
  });

  await addHistoryEntry(
    id,
    'IN_PROGRESS',
    'COMPLETED',
    userId,
    `Check-out at ${data.mileage} km. Distance: ${actualMileage} km`
  );

  await createNotification({
    userId: reservation.userId,
    type: 'RESERVATION_ENDED',
    title: 'Reservation Completed',
    message: `Your reservation ${reservation.referenceNumber} has been completed`,
    entityType: 'reservation',
    entityId: id,
  });

  logger.info(`Reservation checked out: ${reservation.referenceNumber}`);

  return updated;
}

export async function getUpcomingReservations(
  userId: string
): Promise<ReservationWithRelations[]> {
  return prisma.reservation.findMany({
    where: {
      userId,
      status: { in: ['APPROVED', 'PENDING'] },
      startDate: { gt: new Date() },
    },
    orderBy: { startDate: 'asc' },
    take: 5,
    include: reservationInclude,
  });
}

export async function getActiveReservations(
  userId?: string
): Promise<ReservationWithRelations[]> {
  const where: Prisma.ReservationWhereInput = {
    status: 'IN_PROGRESS',
  };

  if (userId) {
    where.userId = userId;
  }

  return prisma.reservation.findMany({
    where,
    orderBy: { startDate: 'asc' },
    include: reservationInclude,
  });
}

export async function getCalendarReservations(
  startDate: Date,
  endDate: Date,
  vehicleId?: string
): Promise<ReservationWithRelations[]> {
  return prisma.reservation.findMany({
    where: {
      status: { in: ['APPROVED', 'IN_PROGRESS', 'PENDING'] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      ...(vehicleId && { vehicleId }),
    },
    include: reservationInclude,
  });
}
