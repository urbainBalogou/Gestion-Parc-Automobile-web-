import { Response, NextFunction } from 'express';
import * as notificationService from '../../../../backend/src/services/notification.service.js';
import type { AuthenticatedRequest } from '../validators/index.js';

export async function getNotifications(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await notificationService.getUserNotifications(
      req.user!.id,
      {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string, 10)
          : undefined,
        unreadOnly: req.query.unreadOnly === 'true',
        type: req.query.type as never,
      }
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const count = await notificationService.getUnreadCount(req.user!.id);

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const notification = await notificationService.markAsRead(
      req.user!.id,
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const count = await notificationService.markAllAsRead(req.user!.id);

    res.status(200).json({
      success: true,
      message: `${count} notifications marked as read`,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteNotification(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await notificationService.deleteNotification(req.user!.id, req.params.id);

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
}

export async function getPreferences(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const preferences = await notificationService.getNotificationPreferences(
      req.user!.id
    );

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePreferences(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const preferences = await notificationService.updateNotificationPreferences(
      req.user!.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
}
