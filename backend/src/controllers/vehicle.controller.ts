import { Response, NextFunction } from 'express';
import * as vehicleService from '../../../../backend/src/services/vehicle.service.js';
import type { AuthenticatedRequest } from '../validators/index.js';

export async function createVehicle(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vehicle = await vehicleService.createVehicle(req.body, req.user!.id);

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
}

export async function getVehicles(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await vehicleService.getVehicles(req.query as Record<string, string>);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getVehicleById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vehicle = await vehicleService.getVehicleById(req.params.id);

    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateVehicle(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vehicle = await vehicleService.updateVehicle(
      req.params.id,
      req.body,
      req.user!.id
    );

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteVehicle(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await vehicleService.deleteVehicle(req.params.id, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateVehicleStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vehicle = await vehicleService.updateVehicleStatus(
      req.params.id,
      req.body.status,
      req.user!.id,
      req.body.reason
    );

    res.status(200).json({
      success: true,
      message: 'Vehicle status updated successfully',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateVehicleMileage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vehicle = await vehicleService.updateVehicleMileage(
      req.params.id,
      req.body.mileage,
      req.user!.id
    );

    res.status(200).json({
      success: true,
      message: 'Mileage updated successfully',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAvailableVehicles(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate, type } = req.query;
    const vehicles = await vehicleService.getAvailableVehicles(
      new Date(startDate as string),
      new Date(endDate as string),
      type as string | undefined
    );

    res.status(200).json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    next(error);
  }
}

export async function getVehicleStatistics(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await vehicleService.getVehicleStatistics(req.params.id);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

export async function addPhoto(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    const url = `/uploads/${req.file.filename}`;
    await vehicleService.addVehiclePhoto(
      req.params.id,
      url,
      req.body.isPrimary === 'true'
    );

    res.status(201).json({
      success: true,
      message: 'Photo added successfully',
      data: { url },
    });
  } catch (error) {
    next(error);
  }
}

export async function removePhoto(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await vehicleService.removeVehiclePhoto(req.params.id, req.params.photoId);

    res.status(200).json({
      success: true,
      message: 'Photo removed successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleFavorite(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const isFavorite = await vehicleService.toggleFavorite(
      req.user!.id,
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: isFavorite ? 'Added to favorites' : 'Removed from favorites',
      data: { isFavorite },
    });
  } catch (error) {
    next(error);
  }
}

export async function getFavorites(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vehicles = await vehicleService.getUserFavorites(req.user!.id);

    res.status(200).json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    next(error);
  }
}
