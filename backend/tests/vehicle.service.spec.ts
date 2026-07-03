import { jest } from '@jest/globals';

const prismaMock = {
  vehicle: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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

const vehicleService = await import('../src/services/vehicle.service.js');
const { ConflictError, NotFoundError } = await import('../src/utils/errors.js');

beforeEach(() => {
  prismaMock.auditLog.create.mockResolvedValue({});
});

describe('vehicle.service > createVehicle', () => {
  const input = {
    registrationNumber: 'TG-1234-A',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    type: 'SEDAN' as const,
  };

  it('rejects when the registration number already exists', async () => {
    prismaMock.vehicle.findUnique.mockResolvedValue({ id: 'existing-vehicle' });

    await expect(vehicleService.createVehicle(input, 'admin-1')).rejects.toThrow(
      ConflictError
    );
    expect(prismaMock.vehicle.create).not.toHaveBeenCalled();
  });

  it('creates the vehicle when the registration number is free', async () => {
    prismaMock.vehicle.findUnique.mockResolvedValue(null);
    prismaMock.vehicle.create.mockResolvedValue({ id: 'new-vehicle', ...input });

    const result = await vehicleService.createVehicle(input, 'admin-1');

    expect(result.id).toBe('new-vehicle');
    expect(prismaMock.vehicle.create).toHaveBeenCalledTimes(1);
  });
});

describe('vehicle.service > deleteVehicle', () => {
  it('rejects deleting a vehicle that does not exist', async () => {
    prismaMock.vehicle.findUnique.mockResolvedValue(null);

    await expect(vehicleService.deleteVehicle('missing', 'admin-1')).rejects.toThrow(
      NotFoundError
    );
  });

  it('rejects deleting a vehicle with active reservations', async () => {
    prismaMock.vehicle.findUnique.mockResolvedValue({
      id: 'v1',
      registrationNumber: 'TG-1234-A',
      reservations: [{ id: 'res-1', status: 'APPROVED' }],
    });

    await expect(vehicleService.deleteVehicle('v1', 'admin-1')).rejects.toThrow(
      ConflictError
    );
    expect(prismaMock.vehicle.update).not.toHaveBeenCalled();
  });

  it('soft-deletes a vehicle with no active reservations', async () => {
    prismaMock.vehicle.findUnique.mockResolvedValue({
      id: 'v1',
      registrationNumber: 'TG-1234-A',
      reservations: [],
    });
    prismaMock.vehicle.update.mockResolvedValue({ id: 'v1', isActive: false });

    await vehicleService.deleteVehicle('v1', 'admin-1');

    expect(prismaMock.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'v1' },
        data: { isActive: false },
      })
    );
  });
});
