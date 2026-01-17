import { Prisma, VehicleStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import {
  parsePaginationParams,
  createPaginatedResponse,
  calculateSkip,
  generateQRCode,
  doDateRangesOverlap,
} from '../utils/helpers.js';
import type { PaginatedResponse } from '../validators/index.js';
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleQueryInput,
} from '../validators/vehicle.validator.js';

type VehicleWithRelations = Prisma.VehicleGetPayload<{
  include: {
    location: true;
    photos: true;
    _count: {
      select: { reservations: true; maintenances: true };
    };
  };
}>;

export async function createVehicle(
  data: CreateVehicleInput,
  userId: string
): Promise<VehicleWithRelations> {
  // Check for duplicate registration
  const existing = await prisma.vehicle.findUnique({
    where: { registrationNumber: data.registrationNumber },
  });

  if (existing) {
    throw new ConflictError('Vehicle with this registration number already exists');
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      ...data,
      qrCode: generateQRCode(),
      insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : null,
      technicalInspectionExpiry: data.technicalInspectionExpiry
        ? new Date(data.technicalInspectionExpiry)
        : null,
    },
    include: {
      location: true,
      photos: true,
      _count: {
        select: { reservations: true, maintenances: true },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CREATE',
      entityType: 'vehicle',
      entityId: vehicle.id,
      newValue: data as Prisma.InputJsonValue,
    },
  });

  logger.info(`Vehicle created: ${vehicle.registrationNumber}`);

  return vehicle;
}

export async function getVehicles(
  query: VehicleQueryInput
): Promise<PaginatedResponse<VehicleWithRelations>> {
  const pagination = parsePaginationParams(query);
  const skip = calculateSkip(pagination.page, pagination.limit);

  const where: Prisma.VehicleWhereInput = {
    isActive: true,
  };

  if (query.search) {
    where.OR = [
      { registrationNumber: { contains: query.search, mode: 'insensitive' } },
      { brand: { contains: query.search, mode: 'insensitive' } },
      { model: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.type) {
    where.type = query.type;
  }

  if (query.fuelType) {
    where.fuelType = query.fuelType;
  }

  if (query.locationId) {
    where.locationId = query.locationId;
  }

  if (query.minSeats !== undefined || query.maxSeats !== undefined) {
    where.seats = {};
    if (query.minSeats !== undefined) {
      where.seats.gte = query.minSeats;
    }
    if (query.maxSeats !== undefined) {
      where.seats.lte = query.maxSeats;
    }
  }

  const orderBy: Prisma.VehicleOrderByWithRelationInput = {};
  if (pagination.sortBy) {
    orderBy[pagination.sortBy as keyof Prisma.VehicleOrderByWithRelationInput] =
      pagination.sortOrder;
  } else {
    orderBy.createdAt = 'desc';
  }

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take: pagination.limit,
      orderBy,
      include: {
        location: true,
        photos: true,
        _count: {
          select: { reservations: true, maintenances: true },
        },
      },
    }),
    prisma.vehicle.count({ where }),
  ]);

  return createPaginatedResponse(vehicles, total, pagination);
}

export async function getVehicleById(id: string): Promise<VehicleWithRelations> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      location: true,
      photos: true,
      _count: {
        select: { reservations: true, maintenances: true },
      },
    },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  return vehicle;
}

export async function updateVehicle(
  id: string,
  data: UpdateVehicleInput,
  userId: string
): Promise<VehicleWithRelations> {
  const existing = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NotFoundError('Vehicle not found');
  }

  // Check for duplicate registration if changing
  if (
    data.registrationNumber &&
    data.registrationNumber !== existing.registrationNumber
  ) {
    const duplicate = await prisma.vehicle.findUnique({
      where: { registrationNumber: data.registrationNumber },
    });

    if (duplicate) {
      throw new ConflictError('Vehicle with this registration number already exists');
    }
  }

  const updateData: Prisma.VehicleUpdateInput = {
    ...data,
    insuranceExpiry: data.insuranceExpiry
      ? new Date(data.insuranceExpiry)
      : undefined,
    technicalInspectionExpiry: data.technicalInspectionExpiry
      ? new Date(data.technicalInspectionExpiry)
      : undefined,
  };

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: updateData,
    include: {
      location: true,
      photos: true,
      _count: {
        select: { reservations: true, maintenances: true },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE',
      entityType: 'vehicle',
      entityId: id,
      oldValue: existing as unknown as Prisma.InputJsonValue,
      newValue: data as Prisma.InputJsonValue,
    },
  });

  logger.info(`Vehicle updated: ${vehicle.registrationNumber}`);

  return vehicle;
}

export async function deleteVehicle(id: string, userId: string): Promise<void> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      reservations: {
        where: {
          status: { in: ['PENDING', 'APPROVED', 'IN_PROGRESS'] },
        },
      },
    },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  if (vehicle.reservations.length > 0) {
    throw new ConflictError(
      'Cannot delete vehicle with active reservations'
    );
  }

  // Soft delete
  await prisma.vehicle.update({
    where: { id },
    data: { isActive: false },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'DELETE',
      entityType: 'vehicle',
      entityId: id,
      oldValue: { registrationNumber: vehicle.registrationNumber } as Prisma.InputJsonValue,
    },
  });

  logger.info(`Vehicle deleted: ${vehicle.registrationNumber}`);
}

export async function updateVehicleStatus(
  id: string,
  status: VehicleStatus,
  userId: string,
  reason?: string
): Promise<VehicleWithRelations> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  const updated = await prisma.vehicle.update({
    where: { id },
    data: { status },
    include: {
      location: true,
      photos: true,
      _count: {
        select: { reservations: true, maintenances: true },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'STATUS_CHANGE',
      entityType: 'vehicle',
      entityId: id,
      oldValue: { status: vehicle.status } as Prisma.InputJsonValue,
      newValue: { status, reason } as Prisma.InputJsonValue,
    },
  });

  logger.info(`Vehicle status changed: ${vehicle.registrationNumber} -> ${status}`);

  return updated;
}

export async function updateVehicleMileage(
  id: string,
  mileage: number,
  userId: string
): Promise<VehicleWithRelations> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  if (mileage < vehicle.currentMileage) {
    throw new ConflictError('New mileage cannot be less than current mileage');
  }

  const updated = await prisma.vehicle.update({
    where: { id },
    data: { currentMileage: mileage },
    include: {
      location: true,
      photos: true,
      _count: {
        select: { reservations: true, maintenances: true },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE',
      entityType: 'vehicle',
      entityId: id,
      oldValue: { currentMileage: vehicle.currentMileage } as Prisma.InputJsonValue,
      newValue: { currentMileage: mileage } as Prisma.InputJsonValue,
    },
  });

  return updated;
}

export async function addVehiclePhoto(
  vehicleId: string,
  url: string,
  isPrimary: boolean = false
): Promise<void> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  // If setting as primary, unset other primaries
  if (isPrimary) {
    await prisma.vehiclePhoto.updateMany({
      where: { vehicleId },
      data: { isPrimary: false },
    });
  }

  await prisma.vehiclePhoto.create({
    data: {
      vehicleId,
      url,
      isPrimary,
    },
  });
}

export async function removeVehiclePhoto(
  vehicleId: string,
  photoId: string
): Promise<void> {
  await prisma.vehiclePhoto.delete({
    where: {
      id: photoId,
      vehicleId,
    },
  });
}

export async function getAvailableVehicles(
  startDate: Date,
  endDate: Date,
  type?: string
): Promise<VehicleWithRelations[]> {
  // Get all vehicles that don't have conflicting reservations
  const vehicles = await prisma.vehicle.findMany({
    where: {
      isActive: true,
      status: VehicleStatus.AVAILABLE,
      ...(type && { type: type as VehicleStatus }),
    },
    include: {
      location: true,
      photos: true,
      reservations: {
        where: {
          status: { in: ['APPROVED', 'IN_PROGRESS'] },
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
          ],
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
        },
      },
      _count: {
        select: { reservations: true, maintenances: true },
      },
    },
  });

  // Filter out vehicles with conflicting reservations
  return vehicles.filter((vehicle) => {
    return !vehicle.reservations.some((res) =>
      doDateRangesOverlap(startDate, endDate, res.startDate, res.endDate)
    );
  });
}

export async function getVehicleStatistics(vehicleId: string): Promise<{
  totalReservations: number;
  completedReservations: number;
  totalMileage: number;
  maintenanceCount: number;
  averageRating: number | null;
}> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      reservations: {
        select: {
          status: true,
          actualMileage: true,
          rating: true,
        },
      },
      maintenances: {
        select: { id: true },
      },
    },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  const completedReservations = vehicle.reservations.filter(
    (r) => r.status === 'COMPLETED'
  );

  const totalMileage = completedReservations.reduce(
    (sum, r) => sum + (r.actualMileage || 0),
    0
  );

  const ratings = completedReservations
    .map((r) => r.rating)
    .filter((r): r is number => r !== null);

  const averageRating =
    ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  return {
    totalReservations: vehicle.reservations.length,
    completedReservations: completedReservations.length,
    totalMileage,
    maintenanceCount: vehicle.maintenances.length,
    averageRating,
  };
}

export async function toggleFavorite(
  userId: string,
  vehicleId: string
): Promise<boolean> {
  const existing = await prisma.favoriteVehicle.findUnique({
    where: {
      userId_vehicleId: { userId, vehicleId },
    },
  });

  if (existing) {
    await prisma.favoriteVehicle.delete({
      where: { id: existing.id },
    });
    return false;
  }

  await prisma.favoriteVehicle.create({
    data: { userId, vehicleId },
  });

  return true;
}

export async function getUserFavorites(
  userId: string
): Promise<VehicleWithRelations[]> {
  const favorites = await prisma.favoriteVehicle.findMany({
    where: { userId },
    include: {
      vehicle: {
        include: {
          location: true,
          photos: true,
          _count: {
            select: { reservations: true, maintenances: true },
          },
        },
      },
    },
  });

  return favorites.map((f) => f.vehicle);
}
