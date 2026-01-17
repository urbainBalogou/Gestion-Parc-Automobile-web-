import { Request, Response, NextFunction } from 'express';
import * as authService from '../../../../backend/src/services/auth.service.js';
import type { AuthenticatedRequest } from '../validators/index.js';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await authService.register(req.body, ipAddress);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await authService.login(req.body, ipAddress, userAgent);

    if (result.requires2FA) {
      res.status(200).json({
        success: true,
        message: '2FA code required',
        data: { requires2FA: true },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await authService.refreshAccessToken(
      req.body.refreshToken,
      ipAddress
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    await authService.logout(req.user!.id, req.body.refreshToken, ipAddress);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutAll(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    await authService.logoutAllSessions(req.user!.id, ipAddress);

    res.status(200).json({
      success: true,
      message: 'All sessions logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await authService.verifyEmail(req.body.token);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await authService.forgotPassword(req.body.email);

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent',
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    await authService.resetPassword(
      req.body.token,
      req.body.password,
      ipAddress
    );

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    await authService.changePassword(req.user!.id, req.body, ipAddress);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function setup2FA(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.setup2FA(req.user!.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function enable2FA(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await authService.enable2FA(req.user!.id, req.body.code);

    res.status(200).json({
      success: true,
      message: '2FA enabled successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function disable2FA(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    await authService.disable2FA(req.user!.id, req.body.code, ipAddress);

    res.status(200).json({
      success: true,
      message: '2FA disabled successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getSessions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessions = await authService.getActiveSessions(req.user!.id);

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
}

export async function revokeSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await authService.revokeSession(req.user!.id, req.params.sessionId);

    res.status(200).json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
}
