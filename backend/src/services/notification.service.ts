import { Prisma, NotificationType, NotificationPriority } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import {
  parsePaginationParams,
  createPaginatedResponse,
  calculateSkip,
} from '../utils/helpers.js';
import type { PaginatedResponse } from '../validators/index.js';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  entityType?: string;
  entityId?: string;
  data?: Prisma.InputJsonValue;
}

type NotificationWithDetails = Prisma.NotificationGetPayload<{
  select: {
    id: true;
    type: true;
    priority: true;
    title: true;
    message: true;
    data: true;
    isRead: true;
    readAt: true;
    entityType: true;
    entityId: true;
    createdAt: true;
  };
}>;

export async function createNotification(
  input: CreateNotificationInput
): Promise<NotificationWithDetails> {
  // Check user notification preferences
  const preferences = await prisma.notificationPreference.findUnique({
    where: { userId: input.userId },
  });

  // Determine if we should create based on type
  if (preferences) {
    const typeChecks: Record<string, boolean> = {
      RESERVATION_CREATED: preferences.inAppReservation,
      RESERVATION_APPROVED: preferences.inAppApproval,
      RESERVATION_REJECTED: preferences.inAppApproval,
      RESERVATION_CANCELLED: preferences.inAppReservation,
      RESERVATION_REMINDER: preferences.inAppReminder,
      RESERVATION_STARTED: preferences.inAppReservation,
      RESERVATION_ENDED: preferences.inAppReservation,
      MAINTENANCE_SCHEDULED: preferences.inAppMaintenance,
      MAINTENANCE_DUE: preferences.inAppMaintenance,
      SYSTEM: preferences.inAppSystem,
    };

    if (typeChecks[input.type] === false) {
      logger.debug(`Notification skipped for user ${input.userId} based on preferences`);
      // Return a dummy notification object
      return {
        id: '',
        type: input.type,
        priority: input.priority || 'MEDIUM',
        title: input.title,
        message: input.message,
        data: null,
        isRead: true,
        readAt: new Date(),
        entityType: input.entityType || null,
        entityId: input.entityId || null,
        createdAt: new Date(),
      };
    }
  }

  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      priority: input.priority || 'MEDIUM',
      title: input.title,
      message: input.message,
      data: input.data,
      entityType: input.entityType,
      entityId: input.entityId,
    },
    select: {
      id: true,
      type: true,
      priority: true,
      title: true,
      message: true,
      data: true,
      isRead: true,
      readAt: true,
      entityType: true,
      entityId: true,
      createdAt: true,
    },
  });

  logger.debug(`Notification created for user ${input.userId}: ${input.title}`);

  return notification;
}

export async function getUserNotifications(
  userId: string,
  query: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  }
): Promise<PaginatedResponse<NotificationWithDetails>> {
  const pagination = parsePaginationParams({
    page: query.page?.toString(),
    limit: query.limit?.toString(),
  });
  const skip = calculateSkip(pagination.page, pagination.limit);

  const where: Prisma.NotificationWhereInput = {
    userId,
  };

  if (query.unreadOnly) {
    where.isRead = false;
  }

  if (query.type) {
    where.type = query.type;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: pagination.limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        priority: true,
        title: true,
        message: true,
        data: true,
        isRead: true,
        readAt: true,
        entityType: true,
        entityId: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return createPaginatedResponse(notifications, total, pagination);
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function markAsRead(
  userId: string,
  notificationId: string
): Promise<NotificationWithDetails> {
  const notification = await prisma.notification.update({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
    select: {
      id: true,
      type: true,
      priority: true,
      title: true,
      message: true,
      data: true,
      isRead: true,
      readAt: true,
      entityType: true,
      entityId: true,
      createdAt: true,
    },
  });

  return notification;
}

export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return result.count;
}

export async function deleteNotification(
  userId: string,
  notificationId: string
): Promise<void> {
  await prisma.notification.delete({
    where: {
      id: notificationId,
      userId,
    },
  });
}

export async function deleteOldNotifications(
  olderThanDays: number = 30
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      isRead: true,
    },
  });

  logger.info(`Deleted ${result.count} old notifications`);

  return result.count;
}

export async function createBulkNotifications(
  userIds: string[],
  notification: Omit<CreateNotificationInput, 'userId'>
): Promise<number> {
  const notifications = userIds.map((userId) => ({
    userId,
    type: notification.type,
    priority: notification.priority || 'MEDIUM',
    title: notification.title,
    message: notification.message,
    data: notification.data,
    entityType: notification.entityType,
    entityId: notification.entityId,
  }));

  const result = await prisma.notification.createMany({
    data: notifications,
  });

  logger.info(`Created ${result.count} bulk notifications`);

  return result.count;
}

export async function getNotificationPreferences(
  userId: string
): Promise<Prisma.NotificationPreferenceGetPayload<object> | null> {
  return prisma.notificationPreference.findUnique({
    where: { userId },
  });
}

export async function updateNotificationPreferences(
  userId: string,
  data: Prisma.NotificationPreferenceUpdateInput
): Promise<Prisma.NotificationPreferenceGetPayload<object>> {
  return prisma.notificationPreference.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data,
    } as Prisma.NotificationPreferenceCreateInput,
  });
}
