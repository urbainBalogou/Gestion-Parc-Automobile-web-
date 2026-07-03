import { jest } from '@jest/globals';

const prismaMock = {
  reservation: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  vehicle: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  reservationHistory: {
    create: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  notificationPreference: {
    findUnique: jest.fn(),
  },
  notification: {
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
  sendReservationConfirmationEmail: jest.fn(),
  sendReservationStatusEmail: jest.fn(),
}));

jest.unstable_mockModule('../src/services/notification.service.js', () => ({
  createNotification: jest.fn(),
}));

const reservationService = await import('../src/services/reservation.service.js');
const { BadRequestError, NotFoundError, ConflictError } = await import(
  '../src/utils/errors.js'
);

function makeVehicle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'vehicle-1',
    status: 'AVAILABLE',
    brand: 'Toyota',
    model: 'Corolla',
    dailyRate: 20000,
    mileageRate: 100,
    currentMileage: 1000,
    photos: [],
    ...overrides,
  };
}

function makeReservation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'res-1',
    referenceNumber: 'RES-TEST',
    userId: 'user-1',
    vehicleId: 'vehicle-1',
    status: 'PENDING',
    startDate: new Date(Date.now() + 24 * 3600 * 1000),
    endDate: new Date(Date.now() + 30 * 3600 * 1000),
    checkInMileage: null,
    vehicle: makeVehicle(),
    user: { email: 'user@test.com', firstName: 'Test' },
    ...overrides,
  };
}

beforeEach(() => {
  prismaMock.user.findMany.mockResolvedValue([]);
  prismaMock.reservationHistory.create.mockResolvedValue({});
  prismaMock.auditLog.create.mockResolvedValue({});
  prismaMock.notificationPreference.findUnique.mockResolvedValue(null);
});

describe('reservation.service > createReservation', () => {
  const validInput = {
    vehicleId: 'vehicle-1',
    startDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 3600 * 1000).toISOString(),
    purpose: 'Mission client importante',
    destination: 'Lome',
  };

  it('rejects a reservation whose start date is in the past', async () => {
    await expect(
      reservationService.createReservation(
        { ...validInput, startDate: new Date(Date.now() - 3600 * 1000).toISOString() },
        'user-1'
      )
    ).rejects.toThrow(BadRequestError);
  });

  it('rejects when the vehicle does not exist', async () => {
    prismaMock.vehicle.findUnique.mockResolvedValue(null);

    await expect(
      reservationService.createReservation(validInput, 'user-1')
    ).rejects.toThrow(NotFoundError);
  });

  it('rejects when the vehicle is not AVAILABLE', async () => {
    prismaMock.vehicle.findUnique.mockResolvedValue(makeVehicle({ status: 'MAINTENANCE' }));

    await expect(
      reservationService.createReservation(validInput, 'user-1')
    ).rejects.toThrow(ConflictError);
  });

  it('rejects when there is a conflicting reservation on the same dates', async () => {
    prismaMock.vehicle.findUnique.mockResolvedValue(makeVehicle());
    prismaMock.reservation.findFirst.mockResolvedValue(makeReservation());

    await expect(
      reservationService.createReservation(validInput, 'user-1')
    ).rejects.toThrow(ConflictError);
  });

  it('creates a PENDING reservation and notifies managers when everything is valid', async () => {
    prismaMock.vehicle.findUnique.mockResolvedValue(makeVehicle());
    prismaMock.reservation.findFirst.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({
      departmentId: 'dept-1',
      email: 'user@test.com',
      firstName: 'Test',
    });
    prismaMock.user.findMany.mockResolvedValue([{ id: 'manager-1' }]);
    prismaMock.reservation.create.mockResolvedValue(makeReservation());

    const result = await reservationService.createReservation(validInput, 'user-1');

    expect(result.status).toBe('PENDING');
    expect(prismaMock.reservation.create).toHaveBeenCalledTimes(1);
    const createArgs = prismaMock.reservation.create.mock.calls[0][0];
    expect(createArgs.data.status).toBe('PENDING');
  });
});

describe('reservation.service > approveReservation', () => {
  it('rejects approving a reservation that is not PENDING', async () => {
    prismaMock.reservation.findUnique.mockResolvedValue(
      makeReservation({ status: 'APPROVED' })
    );

    await expect(
      reservationService.approveReservation('res-1', 'manager-1')
    ).rejects.toThrow(ConflictError);
  });

  it('rejects approving when the vehicle became unavailable in the meantime', async () => {
    prismaMock.reservation.findUnique.mockResolvedValue(makeReservation());
    prismaMock.reservation.findFirst.mockResolvedValue(makeReservation({ id: 'other-res' }));

    await expect(
      reservationService.approveReservation('res-1', 'manager-1')
    ).rejects.toThrow(ConflictError);
  });

  it('approves a valid pending reservation', async () => {
    prismaMock.reservation.findUnique.mockResolvedValue(makeReservation());
    prismaMock.reservation.findFirst.mockResolvedValue(null);
    prismaMock.reservation.update.mockResolvedValue(makeReservation({ status: 'APPROVED' }));

    const result = await reservationService.approveReservation('res-1', 'manager-1', 'ok');

    expect(result.status).toBe('APPROVED');
    expect(prismaMock.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'APPROVED', approvedById: 'manager-1' }),
      })
    );
  });
});

describe('reservation.service > cancelReservation', () => {
  it('rejects cancelling a COMPLETED reservation', async () => {
    prismaMock.reservation.findUnique.mockResolvedValue(
      makeReservation({ status: 'COMPLETED' })
    );

    await expect(
      reservationService.cancelReservation('res-1', 'user-1', 'changed my mind')
    ).rejects.toThrow(ConflictError);
  });

  it('cancels a PENDING reservation', async () => {
    prismaMock.reservation.findUnique.mockResolvedValue(makeReservation({ status: 'PENDING' }));
    prismaMock.reservation.update.mockResolvedValue(makeReservation({ status: 'CANCELLED' }));

    const result = await reservationService.cancelReservation('res-1', 'user-1', 'plans changed');

    expect(result.status).toBe('CANCELLED');
  });
});

describe('reservation.service > checkIn', () => {
  it('rejects check-in on a reservation that is not APPROVED', async () => {
    prismaMock.reservation.findUnique.mockResolvedValue(
      makeReservation({ status: 'PENDING', vehicle: makeVehicle() })
    );

    await expect(
      reservationService.checkIn('res-1', 'manager-1', { mileage: 1500 })
    ).rejects.toThrow(ConflictError);
  });

  it('checks in an APPROVED reservation and marks the vehicle IN_USE', async () => {
    prismaMock.reservation.findUnique.mockResolvedValue(
      makeReservation({ status: 'APPROVED', vehicle: makeVehicle() })
    );
    prismaMock.reservation.update.mockResolvedValue(
      makeReservation({ status: 'IN_PROGRESS' })
    );
    prismaMock.vehicle.update.mockResolvedValue(makeVehicle({ status: 'IN_USE' }));

    const result = await reservationService.checkIn('res-1', 'manager-1', { mileage: 1500 });

    expect(result.status).toBe('IN_PROGRESS');
    expect(prismaMock.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'IN_USE' }) })
    );
  });
});

describe('reservation.service > checkOut', () => {
  it('rejects check-out on a reservation that is not IN_PROGRESS', async () => {
    prismaMock.reservation.findUnique.mockResolvedValue(
      makeReservation({ status: 'APPROVED', vehicle: makeVehicle() })
    );

    await expect(
      reservationService.checkOut('res-1', 'manager-1', { mileage: 1600 })
    ).rejects.toThrow(ConflictError);
  });

  it('rejects when check-out mileage is less than check-in mileage', async () => {
    prismaMock.reservation.findUnique.mockResolvedValue(
      makeReservation({ status: 'IN_PROGRESS', checkInMileage: 1500, vehicle: makeVehicle() })
    );

    await expect(
      reservationService.checkOut('res-1', 'manager-1', { mileage: 1400 })
    ).rejects.toThrow(BadRequestError);
  });

  it('completes checkout, computes distance/cost and frees the vehicle', async () => {
    prismaMock.reservation.findUnique.mockResolvedValue(
      makeReservation({
        status: 'IN_PROGRESS',
        checkInMileage: 1000,
        actualStartDate: new Date(Date.now() - 3600 * 1000),
        vehicle: makeVehicle({ dailyRate: 20000, mileageRate: 100 }),
      })
    );
    prismaMock.reservation.update.mockResolvedValue(makeReservation({ status: 'COMPLETED' }));
    prismaMock.vehicle.update.mockResolvedValue(makeVehicle({ status: 'AVAILABLE' }));

    const result = await reservationService.checkOut('res-1', 'manager-1', { mileage: 1100 });

    expect(result.status).toBe('COMPLETED');
    const updateArgs = prismaMock.reservation.update.mock.calls[0][0];
    expect(updateArgs.data.actualMileage).toBe(100);
    expect(prismaMock.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'AVAILABLE', currentMileage: 1100 }),
      })
    );
  });
});
