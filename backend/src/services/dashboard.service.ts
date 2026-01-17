import { prisma } from '../config/prisma.js';
import { subDays, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import type { ChartData, StatisticsData } from '../validators/index.js';

export async function getDashboardStats(): Promise<{
  totalVehicles: number;
  availableVehicles: number;
  activeReservations: number;
  pendingApprovals: number;
  monthlyReservations: number;
  utilizationRate: number;
}> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    totalVehicles,
    availableVehicles,
    activeReservations,
    pendingApprovals,
    monthlyReservations,
  ] = await Promise.all([
    prisma.vehicle.count({ where: { isActive: true } }),
    prisma.vehicle.count({ where: { isActive: true, status: 'AVAILABLE' } }),
    prisma.reservation.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.reservation.count({ where: { status: 'PENDING' } }),
    prisma.reservation.count({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),
  ]);

  const utilizationRate =
    totalVehicles > 0
      ? Math.round(((totalVehicles - availableVehicles) / totalVehicles) * 100)
      : 0;

  return {
    totalVehicles,
    availableVehicles,
    activeReservations,
    pendingApprovals,
    monthlyReservations,
    utilizationRate,
  };
}

export async function getReservationTrends(
  days: number = 30
): Promise<ChartData[]> {
  const startDate = subDays(new Date(), days);

  const reservations = await prisma.reservation.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
      status: true,
    },
  });

  // Group by date
  const dateMap = new Map<string, { created: number; completed: number }>();

  for (let i = 0; i <= days; i++) {
    const date = subDays(new Date(), days - i);
    const dateKey = date.toISOString().split('T')[0];
    dateMap.set(dateKey, { created: 0, completed: 0 });
  }

  for (const res of reservations) {
    const dateKey = res.createdAt.toISOString().split('T')[0];
    const entry = dateMap.get(dateKey);
    if (entry) {
      entry.created++;
      if (res.status === 'COMPLETED') {
        entry.completed++;
      }
    }
  }

  return Array.from(dateMap.entries()).map(([date, counts]) => ({
    name: date,
    value: counts.created,
    created: counts.created,
    completed: counts.completed,
  }));
}

export async function getVehicleUtilization(): Promise<ChartData[]> {
  const vehicles = await prisma.vehicle.findMany({
    where: { isActive: true },
    select: {
      id: true,
      brand: true,
      model: true,
      registrationNumber: true,
      _count: {
        select: {
          reservations: {
            where: { status: 'COMPLETED' },
          },
        },
      },
    },
    orderBy: {
      reservations: {
        _count: 'desc',
      },
    },
    take: 10,
  });

  return vehicles.map((v) => ({
    name: `${v.brand} ${v.model}`,
    value: v._count.reservations,
    registrationNumber: v.registrationNumber,
  }));
}

export async function getReservationsByStatus(): Promise<ChartData[]> {
  const counts = await prisma.reservation.groupBy({
    by: ['status'],
    _count: true,
  });

  const statusLabels: Record<string, string> = {
    DRAFT: 'Brouillon',
    PENDING: 'En attente',
    APPROVED: 'Approuvé',
    REJECTED: 'Refusé',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminé',
    CANCELLED: 'Annulé',
  };

  return counts.map((c) => ({
    name: statusLabels[c.status] || c.status,
    value: c._count,
  }));
}

export async function getReservationsByDepartment(): Promise<ChartData[]> {
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    select: {
      name: true,
      _count: {
        select: {
          reservations: true,
        },
      },
    },
  });

  return departments.map((d) => ({
    name: d.name,
    value: d._count.reservations,
  }));
}

export async function getVehiclesByType(): Promise<ChartData[]> {
  const counts = await prisma.vehicle.groupBy({
    by: ['type'],
    where: { isActive: true },
    _count: true,
  });

  const typeLabels: Record<string, string> = {
    SEDAN: 'Berline',
    SUV: 'SUV',
    MINIVAN: 'Minivan',
    UTILITY: 'Utilitaire',
    PICKUP: 'Pickup',
    LUXURY: 'Luxe',
    MOTORCYCLE: 'Moto',
  };

  return counts.map((c) => ({
    name: typeLabels[c.type] || c.type,
    value: c._count,
  }));
}

export async function getVehiclesByStatus(): Promise<ChartData[]> {
  const counts = await prisma.vehicle.groupBy({
    by: ['status'],
    where: { isActive: true },
    _count: true,
  });

  const statusLabels: Record<string, string> = {
    AVAILABLE: 'Disponible',
    RESERVED: 'Réservé',
    IN_USE: 'En utilisation',
    MAINTENANCE: 'En maintenance',
    OUT_OF_SERVICE: 'Hors service',
  };

  return counts.map((c) => ({
    name: statusLabels[c.status] || c.status,
    value: c._count,
  }));
}

export async function getTopUsers(limit: number = 10): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    reservationCount: number;
    department: string | null;
  }>
> {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      department: { select: { name: true } },
      _count: {
        select: { reservations: true },
      },
    },
    orderBy: {
      reservations: { _count: 'desc' },
    },
    take: limit,
  });

  return users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    reservationCount: u._count.reservations,
    department: u.department?.name || null,
  }));
}

export async function getMonthlyStats(
  months: number = 12
): Promise<
  Array<{
    month: string;
    reservations: number;
    completedReservations: number;
    revenue: number;
  }>
> {
  const result: Array<{
    month: string;
    reservations: number;
    completedReservations: number;
    revenue: number;
  }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const [reservations, completed, revenue] = await Promise.all([
      prisma.reservation.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.reservation.count({
        where: {
          status: 'COMPLETED',
          actualEndDate: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.reservation.aggregate({
        where: {
          status: 'COMPLETED',
          actualEndDate: { gte: monthStart, lte: monthEnd },
        },
        _sum: { actualCost: true },
      }),
    ]);

    result.push({
      month: monthStart.toLocaleString('fr-FR', {
        month: 'short',
        year: 'numeric',
      }),
      reservations,
      completedReservations: completed,
      revenue: revenue._sum.actualCost || 0,
    });
  }

  return result;
}

export async function getMaintenanceOverview(): Promise<{
  scheduled: number;
  inProgress: number;
  overdue: number;
  totalCostThisMonth: number;
}> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [scheduled, inProgress, overdue, costs] = await Promise.all([
    prisma.maintenance.count({
      where: { status: 'SCHEDULED' },
    }),
    prisma.maintenance.count({
      where: { status: 'IN_PROGRESS' },
    }),
    prisma.maintenance.count({
      where: {
        status: 'SCHEDULED',
        scheduledDate: { lt: now },
      },
    }),
    prisma.maintenance.aggregate({
      where: {
        status: 'COMPLETED',
        completedDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { actualCost: true },
    }),
  ]);

  return {
    scheduled,
    inProgress,
    overdue,
    totalCostThisMonth: costs._sum.actualCost || 0,
  };
}

export async function getRecentActivity(
  limit: number = 20
): Promise<
  Array<{
    type: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    userName: string;
    timestamp: Date;
  }>
> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return logs.map((log) => ({
    type: 'audit',
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    userId: log.userId || '',
    userName: log.user
      ? `${log.user.firstName} ${log.user.lastName}`
      : 'System',
    timestamp: log.createdAt,
  }));
}

export async function getUserDashboardStats(userId: string): Promise<{
  myReservations: number;
  upcomingReservations: number;
  completedReservations: number;
  pendingApproval: number;
}> {
  const now = new Date();

  const [total, upcoming, completed, pending] = await Promise.all([
    prisma.reservation.count({
      where: { userId },
    }),
    prisma.reservation.count({
      where: {
        userId,
        status: 'APPROVED',
        startDate: { gt: now },
      },
    }),
    prisma.reservation.count({
      where: {
        userId,
        status: 'COMPLETED',
      },
    }),
    prisma.reservation.count({
      where: {
        userId,
        status: 'PENDING',
      },
    }),
  ]);

  return {
    myReservations: total,
    upcomingReservations: upcoming,
    completedReservations: completed,
    pendingApproval: pending,
  };
}

export async function getExpiringDocuments(
  daysAhead: number = 30
): Promise<
  Array<{
    vehicleId: string;
    vehicleName: string;
    registrationNumber: string;
    documentType: string;
    expiryDate: Date;
    daysUntilExpiry: number;
  }>
> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const now = new Date();

  const vehicles = await prisma.vehicle.findMany({
    where: {
      isActive: true,
      OR: [
        {
          insuranceExpiry: { lte: futureDate, gte: now },
        },
        {
          technicalInspectionExpiry: { lte: futureDate, gte: now },
        },
      ],
    },
    select: {
      id: true,
      brand: true,
      model: true,
      registrationNumber: true,
      insuranceExpiry: true,
      technicalInspectionExpiry: true,
    },
  });

  const results: Array<{
    vehicleId: string;
    vehicleName: string;
    registrationNumber: string;
    documentType: string;
    expiryDate: Date;
    daysUntilExpiry: number;
  }> = [];

  for (const v of vehicles) {
    if (v.insuranceExpiry && v.insuranceExpiry <= futureDate) {
      results.push({
        vehicleId: v.id,
        vehicleName: `${v.brand} ${v.model}`,
        registrationNumber: v.registrationNumber,
        documentType: 'Insurance',
        expiryDate: v.insuranceExpiry,
        daysUntilExpiry: Math.ceil(
          (v.insuranceExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
      });
    }
    if (v.technicalInspectionExpiry && v.technicalInspectionExpiry <= futureDate) {
      results.push({
        vehicleId: v.id,
        vehicleName: `${v.brand} ${v.model}`,
        registrationNumber: v.registrationNumber,
        documentType: 'Technical Inspection',
        expiryDate: v.technicalInspectionExpiry,
        daysUntilExpiry: Math.ceil(
          (v.technicalInspectionExpiry.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      });
    }
  }

  return results.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}
