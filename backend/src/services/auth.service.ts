import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { config } from '../config/index.js';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../utils/errors.js';
import { generateToken, hashToken, addHours, addDays } from '../utils/helpers.js';
import { JwtPayload, SafeUser } from '../validators/index.js';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} from './email.service.js';
import type {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
} from '../validators/auth.validator.js';

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 30;

function excludePassword(user: {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  departmentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as SafeUser;
}

function generateAccessToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

function generateRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

export async function register(
  data: RegisterInput,
  ipAddress?: string
): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
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
      departmentId: data.departmentId,
      emailVerificationToken: hashToken(emailVerificationToken),
    },
    select: {
      id: true,
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      twoFactorEnabled: true,
      departmentId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Create notification preferences
  await prisma.notificationPreference.create({
    data: { userId: user.id },
  });

  // Send welcome email
  await sendWelcomeEmail(user.email, user.firstName, emailVerificationToken);

  const tokenPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Create session
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: hashToken(refreshToken),
      ipAddress,
      expiresAt: addDays(new Date(), 7),
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'CREATE',
      entityType: 'user',
      entityId: user.id,
      newValue: { email: user.email },
      ipAddress,
    },
  });

  logger.info(`New user registered: ${user.email}`);

  return {
    user: excludePassword(user),
    accessToken,
    refreshToken,
  };
}

export async function login(
  data: LoginInput,
  ipAddress?: string,
  userAgent?: string
): Promise<{
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  requires2FA?: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000
    );
    throw new UnauthorizedError(
      `Account locked. Try again in ${minutesLeft} minutes`
    );
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    // Increment failed attempts
    const failedAttempts = user.failedLoginAttempts + 1;
    const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
      failedLoginAttempts: failedAttempts,
    };

    if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
      updateData.lockedUntil = addHours(new Date(), LOCK_TIME_MINUTES / 60);
      logger.warn(`Account locked due to failed attempts: ${user.email}`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    throw new UnauthorizedError('Invalid credentials');
  }

  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    if (!data.twoFactorCode) {
      return {
        user: excludePassword({
          ...user,
          password: '',
        }) as SafeUser,
        accessToken: '',
        refreshToken: '',
        requires2FA: true,
      };
    }

    // Verify 2FA code
    if (!user.twoFactorSecret) {
      throw new BadRequestError('2FA not properly configured');
    }

    const isValid = authenticator.verify({
      token: data.twoFactorCode,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedError('Invalid 2FA code');
    }
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is disabled');
  }

  // Reset failed attempts and update last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    },
  });

  const tokenPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Create session
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: hashToken(refreshToken),
      ipAddress,
      userAgent,
      expiresAt: addDays(new Date(), 7),
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      entityType: 'user',
      entityId: user.id,
      ipAddress,
      userAgent,
    },
  });

  logger.info(`User logged in: ${user.email}`);

  return {
    user: excludePassword({
      ...user,
      password: '',
    }) as SafeUser,
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(
  refreshToken: string,
  ipAddress?: string
): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const decoded = jwt.verify(
      refreshToken,
      config.jwt.refreshSecret
    ) as JwtPayload;

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Invalid token type');
    }

    const hashedToken = hashToken(refreshToken);
    const session = await prisma.session.findFirst({
      where: {
        refreshToken: hashedToken,
        userId: decoded.userId,
        isValid: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (!session.user.isActive) {
      throw new UnauthorizedError('Account is disabled');
    }

    // Rotate refresh token
    const tokenPayload = {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Update session with new refresh token
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: hashToken(newRefreshToken),
        ipAddress,
        updatedAt: new Date(),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    throw error;
  }
}

export async function logout(
  userId: string,
  refreshToken: string,
  ipAddress?: string
): Promise<void> {
  const hashedToken = hashToken(refreshToken);

  await prisma.session.updateMany({
    where: {
      userId,
      refreshToken: hashedToken,
    },
    data: {
      isValid: false,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'LOGOUT',
      entityType: 'user',
      entityId: userId,
      ipAddress,
    },
  });

  logger.info(`User logged out: ${userId}`);
}

export async function logoutAllSessions(
  userId: string,
  ipAddress?: string
): Promise<void> {
  await prisma.session.updateMany({
    where: { userId },
    data: { isValid: false },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'LOGOUT',
      entityType: 'user',
      entityId: userId,
      newValue: { allSessions: true },
      ipAddress,
    },
  });

  logger.info(`All sessions logged out for user: ${userId}`);
}

export async function verifyEmail(token: string): Promise<void> {
  const hashedToken = hashToken(token);

  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: hashedToken },
  });

  if (!user) {
    throw new BadRequestError('Invalid or expired verification token');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
    },
  });

  logger.info(`Email verified for user: ${user.email}`);
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Don't reveal if email exists
    return;
  }

  const resetToken = generateToken();
  const hashedToken = hashToken(resetToken);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: addHours(new Date(), 1),
    },
  });

  await sendPasswordResetEmail(user.email, user.firstName, resetToken);

  logger.info(`Password reset email sent to: ${user.email}`);
}

export async function resetPassword(
  token: string,
  newPassword: string,
  ipAddress?: string
): Promise<void> {
  const hashedToken = hashToken(token);

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  // Invalidate all sessions
  await prisma.session.updateMany({
    where: { userId: user.id },
    data: { isValid: false },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'PASSWORD_CHANGE',
      entityType: 'user',
      entityId: user.id,
      ipAddress,
    },
  });

  logger.info(`Password reset for user: ${user.email}`);
}

export async function changePassword(
  userId: string,
  data: ChangePasswordInput,
  ipAddress?: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    data.currentPassword,
    user.password
  );

  if (!isCurrentPasswordValid) {
    throw new BadRequestError('Current password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(data.newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'PASSWORD_CHANGE',
      entityType: 'user',
      entityId: userId,
      ipAddress,
    },
  });

  logger.info(`Password changed for user: ${user.email}`);
}

export async function setup2FA(
  userId: string
): Promise<{ secret: string; qrCode: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, twoFactorEnabled: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.twoFactorEnabled) {
    throw new BadRequestError('2FA is already enabled');
  }

  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(
    user.email,
    config.twoFactor.appName,
    secret
  );

  const qrCode = await QRCode.toDataURL(otpauthUrl);

  // Store secret temporarily (will be confirmed when user verifies)
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });

  return { secret, qrCode };
}

export async function enable2FA(userId: string, code: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.twoFactorEnabled) {
    throw new BadRequestError('2FA is already enabled');
  }

  if (!user.twoFactorSecret) {
    throw new BadRequestError('2FA setup not initiated');
  }

  const isValid = authenticator.verify({
    token: code,
    secret: user.twoFactorSecret,
  });

  if (!isValid) {
    throw new BadRequestError('Invalid verification code');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });

  logger.info(`2FA enabled for user: ${userId}`);
}

export async function disable2FA(
  userId: string,
  code: string,
  ipAddress?: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (!user.twoFactorEnabled) {
    throw new BadRequestError('2FA is not enabled');
  }

  if (!user.twoFactorSecret) {
    throw new BadRequestError('2FA not properly configured');
  }

  const isValid = authenticator.verify({
    token: code,
    secret: user.twoFactorSecret,
  });

  if (!isValid) {
    throw new BadRequestError('Invalid verification code');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE',
      entityType: 'user',
      entityId: userId,
      oldValue: { twoFactorEnabled: true },
      newValue: { twoFactorEnabled: false },
      ipAddress,
    },
  });

  logger.info(`2FA disabled for user: ${userId}`);
}

export async function getActiveSessions(
  userId: string
): Promise<
  Array<{
    id: string;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>
> {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      isValid: true,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return sessions;
}

export async function revokeSession(
  userId: string,
  sessionId: string
): Promise<void> {
  await prisma.session.updateMany({
    where: {
      id: sessionId,
      userId,
    },
    data: { isValid: false },
  });
}
