import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  session: {
    create: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
};

jest.unstable_mockModule('../src/config/prisma.js', () => ({
  prisma: prismaMock,
}));

jest.unstable_mockModule('../src/config/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.unstable_mockModule('../src/services/email.service.js', () => ({
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

const authService = await import('../src/services/auth.service.js');
const { UnauthorizedError, BadRequestError } = await import('../src/utils/errors.js');

const KNOWN_PASSWORD = 'Password@123';
let knownPasswordHash: string;

beforeAll(async () => {
  knownPasswordHash = await bcrypt.hash(KNOWN_PASSWORD, 4);
});

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'employee@togodatalab.tg',
    password: knownPasswordHash,
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    avatar: null,
    role: 'EMPLOYEE',
    isActive: true,
    isEmailVerified: true,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    departmentId: null,
    lastLoginAt: null,
    passwordChangedAt: null,
    driverLicenseNumber: null,
    driverLicenseExpiry: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  prismaMock.session.create.mockResolvedValue({});
  prismaMock.auditLog.create.mockResolvedValue({});
});

describe('auth.service > login', () => {
  it('rejects when the email does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'nobody@togodatalab.tg', password: 'whatever' })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('rejects and increments failedLoginAttempts on wrong password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ failedLoginAttempts: 2 }));
    prismaMock.user.update.mockResolvedValue({});

    await expect(
      authService.login({ email: 'employee@togodatalab.tg', password: 'wrong-password' })
    ).rejects.toThrow(UnauthorizedError);

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ failedLoginAttempts: 3 }),
      })
    );
  });

  it('locks the account after the 5th consecutive failed attempt', async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ failedLoginAttempts: 4 }));
    prismaMock.user.update.mockResolvedValue({});

    await expect(
      authService.login({ email: 'employee@togodatalab.tg', password: 'wrong-password' })
    ).rejects.toThrow(UnauthorizedError);

    const updateArgs = prismaMock.user.update.mock.calls[0][0];
    expect(updateArgs.data.failedLoginAttempts).toBe(5);
    expect(updateArgs.data.lockedUntil).toBeInstanceOf(Date);
  });

  it('rejects immediately when the account is currently locked, without checking the password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      makeUser({ lockedUntil: new Date(Date.now() + 10 * 60 * 1000) })
    );

    await expect(
      authService.login({ email: 'employee@togodatalab.tg', password: KNOWN_PASSWORD })
    ).rejects.toThrow(/Account locked/);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('rejects a disabled account even with the correct password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ isActive: false }));

    await expect(
      authService.login({ email: 'employee@togodatalab.tg', password: KNOWN_PASSWORD })
    ).rejects.toThrow(/disabled/);
  });

  it('logs in successfully with correct credentials and resets failed attempts', async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ failedLoginAttempts: 3 }));
    prismaMock.user.update.mockResolvedValue({});

    const result = await authService.login({
      email: 'employee@togodatalab.tg',
      password: KNOWN_PASSWORD,
    });

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.user.email).toBe('employee@togodatalab.tg');
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ failedLoginAttempts: 0, lockedUntil: null }),
      })
    );
  });

  it('flags requires2FA and withholds tokens when 2FA is enabled and no code is provided', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      makeUser({ twoFactorEnabled: true, twoFactorSecret: 'SECRET123' })
    );

    const result = await authService.login({
      email: 'employee@togodatalab.tg',
      password: KNOWN_PASSWORD,
    });

    expect(result.requires2FA).toBe(true);
    expect(result.accessToken).toBe('');
    expect(prismaMock.session.create).not.toHaveBeenCalled();
  });
});

describe('auth.service > changePassword', () => {
  it('rejects when the current password is incorrect', async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser());

    await expect(
      authService.changePassword('user-1', {
        currentPassword: 'wrong-current-password',
        newPassword: 'NewPassword@123',
      })
    ).rejects.toThrow(BadRequestError);
  });

  it('updates the password hash when the current password is correct', async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser());
    prismaMock.user.update.mockResolvedValue({});

    await authService.changePassword('user-1', {
      currentPassword: KNOWN_PASSWORD,
      newPassword: 'NewPassword@123',
    });

    expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
    const updateArgs = prismaMock.user.update.mock.calls[0][0];
    expect(updateArgs.data.password).not.toBe(knownPasswordHash);
  });
});
