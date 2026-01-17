import { Prisma, MaintenanceStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import {
  parsePaginationParams,
  createPaginatedResponse,
  calculateSkip,
} from '../utils/helpers.js';
import type { PaginatedResponse } from '../validators/index.js';
import { createNotification } from './notification.service.js';
import type {
  CreateMaintenanceInput,
  UpdateMaintenanceInput,
  MaintenanceQueryInput,
} from '../validators/maintenance.validator.js';

type MaintenanceWithRelations = Prisma.MaintenanceGetPayload<{
  include: {
    vehicle: {
      select: {
        id: true;
        brand: true;
        model: true;
        registrationNumber: true;
      };
    };
    documents: true;
  };
}>;

const maintenanceInclude = {
  vehicle: {
    select: {
      id: true,
      brand: true,
      model: true,
      registrationNumber: true,
    },
  },
  documents: true,
};

export async function createMaintenance(
  data: CreateMaintenanceInput,
  userId: string
): Promise<MaintenanceWithRelations> {
  // Check vehicle exists
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: data.vehicleId },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  const maintenance = await prisma.maintenance.create({
    data: {
      vehicleId: data.vehicleId,
      type: data.type,
      description: data.description,
      scheduledDate: new Date(data.scheduledDate),
      estimatedCost: data.estimatedCost,
      providerName: data.providerName,
      providerContact: data.providerContact,
      notes: data.notes,
    },
    include: maintenanceInclude,
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CREATE',
      entityType: 'maintenance',
      entityId: maintenance.id,
      newValue: data as Prisma.InputJsonValue,
    },
  });

  // Notify admins
  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
    select: { id: true },
  });

  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      type: 'MAINTENANCE_SCHEDULED',
      title: 'Maintenance Scheduled',
      message: `Maintenance scheduled for ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})`,
      entityType: 'maintenance',
      entityId: maintenance.id,
    });
  }

  logger.info(
    `Maintenance created for vehicle ${vehicle.registrationNumber}: ${data.type}`
  );

  return maintenance;
}

export async function getMaintenances(
  query: MaintenanceQueryInput
): Promise<PaginatedResponse<MaintenanceWithRelations>> {
  const pagination = parsePaginationParams(query);
  const skip = calculateSkip(pagination.page, pagination.limit);

  const where: Prisma.MaintenanceWhereInput = {};

  if (query.vehicleId) {
    where.vehicleId = query.vehicleId;
  }

  if (query.type) {
    where.type = query.type;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.startDate && query.endDate) {
    where.scheduledDate = {
      gte: new Date(query.startDate),
      lte: new Date(query.endDate),
    };
  } else if (query.startDate) {
    where.scheduledDate = { gte: new Date(query.startDate) };
  } else if (query.endDate) {
    where.scheduledDate = { lte: new Date(query.endDate) };
  }

  const orderBy: Prisma.MaintenanceOrderByWithRelationInput = {};
  if (pagination.sortBy) {
    orderBy[pagination.sortBy as keyof Prisma.MaintenanceOrderByWithRelationInput] =
      pagination.sortOrder;
  } else {
    orderBy.scheduledDate = 'desc';
  }

  const [maintenances, total] = await Promise.all([
    prisma.maintenance.findMany({
      where,
      skip,
      take: pagination.limit,
      orderBy,
      include: maintenanceInclude,
    }),
    prisma.maintenance.count({ where }),
  ]);

  return createPaginatedResponse(maintenances, total, pagination);
}

export async function getMaintenanceById(
  id: string
): Promise<MaintenanceWithRelations> {
  const maintenance = await prisma.maintenance.findUnique({
    where: { id },
    include: maintenanceInclude,
  });

  if (!maintenance) {
    throw new NotFoundError('Maintenance record not found');
  }

  return maintenance;
}

export async function updateMaintenance(
  id: string,
  data: UpdateMaintenanceInput,
  userId: string
): Promise<MaintenanceWithRelations> {
  const existing = await prisma.maintenance.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NotFoundError('Maintenance record not found');
  }

  const maintenance = await prisma.maintenance.update({
    where: { id },
    data: {
      ...data,
      scheduledDate: data.scheduledDate
        ? new Date(data.scheduledDate)
        : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      completedDate: data.completedDate
        ? new Date(data.completedDate)
        : undefined,
    },
    include: maintenanceInclude,
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE',
      entityType: 'maintenance',
      entityId: id,
      oldValue: existing as unknown as Prisma.InputJsonValue,
      newValue: data as Prisma.InputJsonValue,
    },
  });

  logger.info(`Maintenance updated: ${id}`);

  return maintenance;
}

export async function startMaintenance(
  id: string,
  userId: string,
  data?: { mileageAtService?: number; notes?: string }
): Promise<MaintenanceWithRelations> {
  const existing = await prisma.maintenance.findUnique({
    where: { id },
    include: { vehicle: true },
  });

  if (!existing) {
    throw new NotFoundError('Maintenance record not found');
  }

  if (existing.status !== 'SCHEDULED') {
    throw new ConflictError('Only scheduled maintenance can be started');
  }

  // Update vehicle status
  await prisma.vehicle.update({
    where: { id: existing.vehicleId },
    data: { status: 'MAINTENANCE' },
  });

  const maintenance = await prisma.maintenance.update({
    where: { id },
    data: {
      status: 'IN_PROGRESS',
      startDate: new Date(),
      mileageAtService: data?.mileageAtService,
      notes: data?.notes,
    },
    include: maintenanceInclude,
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'STATUS_CHANGE',
      entityType: 'maintenance',
      entityId: id,
      oldValue: { status: 'SCHEDULED' } as Prisma.InputJsonValue,
      newValue: { status: 'IN_PROGRESS' } as Prisma.InputJsonValue,
    },
  });

  logger.info(`Maintenance started: ${id}`);

  return maintenance;
}

export async function completeMaintenance(
  id: string,
  userId: string,
  data: {
    actualCost: number;
    mileageAtService?: number;
    partsReplaced?: string[];
    invoiceNumber?: string;
    notes?: string;
  }
): Promise<MaintenanceWithRelations> {
  const existing = await prisma.maintenance.findUnique({
    where: { id },
    include: { vehicle: true },
  });

  if (!existing) {
    throw new NotFoundError('Maintenance record not found');
  }

  if (existing.status !== 'IN_PROGRESS') {
    throw new ConflictError('Only in-progress maintenance can be completed');
  }

  // Update vehicle status and service info
  await prisma.vehicle.update({
    where: { id: existing.vehicleId },
    data: {
      status: 'AVAILABLE',
      lastServiceDate: new Date(),
      lastServiceMileage: data.mileageAtService || existing.vehicle.currentMileage,
      currentMileage: data.mileageAtService || existing.vehicle.currentMileage,
    },
  });

  const maintenance = await prisma.maintenance.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedDate: new Date(),
      actualCost: data.actualCost,
      mileageAtService: data.mileageAtService,
      partsReplaced: data.partsReplaced || [],
      invoiceNumber: data.invoiceNumber,
      notes: data.notes,
    },
    include: maintenanceInclude,
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'STATUS_CHANGE',
      entityType: 'maintenance',
      entityId: id,
      oldValue: { status: 'IN_PROGRESS' } as Prisma.InputJsonValue,
      newValue: { status: 'COMPLETED', ...data } as Prisma.InputJsonValue,
    },
  });

  logger.info(`Maintenance completed: ${id}`);

  return maintenance;
}

export async function cancelMaintenance(
  id: string,
  userId: string,
  reason?: string
): Promise<MaintenanceWithRelations> {
  const existing = await prisma.maintenance.findUnique({
    where: { id },
    include: { vehicle: true },
  });

  if (!existing) {
    throw new NotFoundError('Maintenance record not found');
  }

  if (existing.status === 'COMPLETED') {
    throw new ConflictError('Completed maintenance cannot be cancelled');
  }

  // If in progress, restore vehicle status
  if (existing.status === 'IN_PROGRESS') {
    await prisma.vehicle.update({
      where: { id: existing.vehicleId },
      data: { status: 'AVAILABLE' },
    });
  }

  const maintenance = await prisma.maintenance.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      notes: reason || existing.notes,
    },
    include: maintenanceInclude,
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'STATUS_CHANGE',
      entityType: 'maintenance',
      entityId: id,
      oldValue: { status: existing.status } as Prisma.InputJsonValue,
      newValue: { status: 'CANCELLED', reason } as Prisma.InputJsonValue,
    },
  });

  logger.info(`Maintenance cancelled: ${id}`);

  return maintenance;
}

export async function getUpcomingMaintenances(
  days: number = 30
): Promise<MaintenanceWithRelations[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return prisma.maintenance.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledDate: {
        gte: new Date(),
        lte: futureDate,
      },
    },
    orderBy: { scheduledDate: 'asc' },
    include: maintenanceInclude,
  });
}

export async function getOverdueMaintenances(): Promise<MaintenanceWithRelations[]> {
  return prisma.maintenance.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledDate: { lt: new Date() },
    },
    orderBy: { scheduledDate: 'asc' },
    include: maintenanceInclude,
  });
}

export async function getVehicleMaintenanceHistory(
  vehicleId: string
): Promise<MaintenanceWithRelations[]> {
  return prisma.maintenance.findMany({
    where: { vehicleId },
    orderBy: { scheduledDate: 'desc' },
    include: maintenanceInclude,
  });
}

export async function getMaintenanceStatistics(): Promise<{
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalCost: number;
  averageCost: number;
}> {
  const [counts, costData] = await Promise.all([
    prisma.maintenance.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.maintenance.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { actualCost: true },
      _avg: { actualCost: true },
    }),
  ]);

  const statusCounts: Record<MaintenanceStatus, number> = {
    SCHEDULED: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  for (const count of counts) {
    statusCounts[count.status] = count._count;
  }

  return {
    scheduled: statusCounts.SCHEDULED,
    inProgress: statusCounts.IN_PROGRESS,
    completed: statusCounts.COMPLETED,
    cancelled: statusCounts.CANCELLED,
    totalCost: costData._sum.actualCost || 0,
    averageCost: costData._avg.actualCost || 0,
  };
}
