import { Response, NextFunction } from 'express';
import * as maintenanceService from '../../../../backend/src/services/maintenance.service.js';
import type { AuthenticatedRequest } from '../validators/index.js';

export async function createMaintenance(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const maintenance = await maintenanceService.createMaintenance(
      req.body,
      req.user!.id
    );

    res.status(201).json({
      success: true,
      message: 'Maintenance scheduled successfully',
      data: maintenance,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMaintenances(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await maintenanceService.getMaintenances(
      req.query as Record<string, string>
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMaintenanceById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const maintenance = await maintenanceService.getMaintenanceById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: maintenance,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMaintenance(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const maintenance = await maintenanceService.updateMaintenance(
      req.params.id,
      req.body,
      req.user!.id
    );

    res.status(200).json({
      success: true,
      message: 'Maintenance updated successfully',
      data: maintenance,
    });
  } catch (error) {
    next(error);
  }
}

export async function startMaintenance(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const maintenance = await maintenanceService.startMaintenance(
      req.params.id,
      req.user!.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Maintenance started',
      data: maintenance,
    });
  } catch (error) {
    next(error);
  }
}

export async function completeMaintenance(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const maintenance = await maintenanceService.completeMaintenance(
      req.params.id,
      req.user!.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Maintenance completed',
      data: maintenance,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelMaintenance(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const maintenance = await maintenanceService.cancelMaintenance(
      req.params.id,
      req.user!.id,
      req.body.reason
    );

    res.status(200).json({
      success: true,
      message: 'Maintenance cancelled',
      data: maintenance,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUpcomingMaintenances(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const maintenances = await maintenanceService.getUpcomingMaintenances(days);

    res.status(200).json({
      success: true,
      data: maintenances,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOverdueMaintenances(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const maintenances = await maintenanceService.getOverdueMaintenances();

    res.status(200).json({
      success: true,
      data: maintenances,
    });
  } catch (error) {
    next(error);
  }
}

export async function getVehicleMaintenanceHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const maintenances = await maintenanceService.getVehicleMaintenanceHistory(
      req.params.vehicleId
    );

    res.status(200).json({
      success: true,
      data: maintenances,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMaintenanceStatistics(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await maintenanceService.getMaintenanceStatistics();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
