import { PrismaClient, Role, VehicleStatus, VehicleType, FuelType, Transmission, ReservationStatus, MaintenanceStatus, MaintenanceType, Priority, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.reservationHistory.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.document.deleteMany();
  await prisma.favoriteVehicle.deleteMany();
  await prisma.vehiclePhoto.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.location.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.holiday.deleteMany();

  // Create departments
  console.log('🏢 Creating departments...');
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Direction Generale',
        code: 'DG',
        description: 'Direction generale de Togo Data Lab',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Informatique',
        code: 'IT',
        description: 'Departement des systemes d\'information',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Ressources Humaines',
        code: 'RH',
        description: 'Gestion des ressources humaines',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Finances',
        code: 'FIN',
        description: 'Departement financier et comptable',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Operations',
        code: 'OPS',
        description: 'Departement des operations',
      },
    }),
  ]);

  // Create locations
  console.log('📍 Creating locations...');
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        name: 'Siege Lome',
        address: 'Boulevard du 13 Janvier',
        city: 'Lome',
        latitude: 6.1319,
        longitude: 1.2228,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Antenne Kara',
        address: 'Avenue de la Liberation',
        city: 'Kara',
        latitude: 9.5511,
        longitude: 1.1861,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Antenne Sokode',
        address: 'Route nationale 1',
        city: 'Sokode',
        latitude: 8.9833,
        longitude: 1.1333,
      },
    }),
  ]);

  // Create users
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('Password@123', 12);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'superadmin@togodatalab.tg',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+228 90 00 00 01',
        role: Role.SUPER_ADMIN,
        departmentId: departments[0].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin@togodatalab.tg',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Systeme',
        phone: '+228 90 00 00 02',
        role: Role.ADMIN,
        departmentId: departments[1].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager@togodatalab.tg',
        password: hashedPassword,
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '+228 90 00 00 03',
        role: Role.MANAGER,
        departmentId: departments[2].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager2@togodatalab.tg',
        password: hashedPassword,
        firstName: 'Marie',
        lastName: 'Kouassi',
        phone: '+228 90 00 00 04',
        role: Role.MANAGER,
        departmentId: departments[3].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'employee@togodatalab.tg',
        password: hashedPassword,
        firstName: 'Kofi',
        lastName: 'Mensah',
        phone: '+228 90 00 00 05',
        role: Role.EMPLOYEE,
        departmentId: departments[1].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'employee2@togodatalab.tg',
        password: hashedPassword,
        firstName: 'Ama',
        lastName: 'Adjei',
        phone: '+228 90 00 00 06',
        role: Role.EMPLOYEE,
        departmentId: departments[4].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'driver@togodatalab.tg',
        password: hashedPassword,
        firstName: 'Kodjo',
        lastName: 'Amegee',
        phone: '+228 90 00 00 07',
        role: Role.DRIVER,
        departmentId: departments[4].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'driver2@togodatalab.tg',
        password: hashedPassword,
        firstName: 'Yao',
        lastName: 'Koffi',
        phone: '+228 90 00 00 08',
        role: Role.DRIVER,
        departmentId: departments[4].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'driver3@togodatalab.tg',
        password: hashedPassword,
        firstName: 'Akouvi',
        lastName: 'Lawson',
        phone: '+228 90 00 00 09',
        role: Role.DRIVER,
        departmentId: departments[4].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'employee3@togodatalab.tg',
        password: hashedPassword,
        firstName: 'Kossi',
        lastName: 'Agbeko',
        phone: '+228 90 00 00 10',
        role: Role.EMPLOYEE,
        departmentId: departments[3].id,
      },
    }),
  ]);

  // Create vehicles
  console.log('🚗 Creating vehicles...');
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TG-1234-DG',
        brand: 'Toyota',
        model: 'Land Cruiser Prado',
        year: 2023,
        type: VehicleType.SUV,
        fuelType: FuelType.DIESEL,
        transmission: Transmission.AUTOMATIC,
        seats: 7,
        color: 'Blanc',
        vin: 'JTDKN3DU5A0000001',
        status: VehicleStatus.AVAILABLE,
        currentMileage: 15000,
        dailyRate: 75000,
        features: ['GPS', 'Climatisation', 'Bluetooth', '4x4', 'Cuir'],
        notes: 'Vehicule de direction',
        locationId: locations[0].id,
        insuranceExpiry: new Date('2025-12-31'),
        technicalInspectionExpiry: new Date('2025-06-30'),
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TG-2345-IT',
        brand: 'Toyota',
        model: 'Hilux',
        year: 2022,
        type: VehicleType.PICKUP,
        fuelType: FuelType.DIESEL,
        transmission: Transmission.MANUAL,
        seats: 5,
        color: 'Gris',
        vin: 'JTDKN3DU5A0000002',
        status: VehicleStatus.AVAILABLE,
        currentMileage: 45000,
        dailyRate: 50000,
        features: ['Climatisation', '4x4', 'Benne'],
        notes: 'Vehicule terrain',
        locationId: locations[0].id,
        insuranceExpiry: new Date('2025-10-31'),
        technicalInspectionExpiry: new Date('2025-04-30'),
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TG-3456-RH',
        brand: 'Hyundai',
        model: 'Tucson',
        year: 2023,
        type: VehicleType.SUV,
        fuelType: FuelType.GASOLINE,
        transmission: Transmission.AUTOMATIC,
        seats: 5,
        color: 'Noir',
        vin: 'JTDKN3DU5A0000003',
        status: VehicleStatus.RESERVED,
        currentMileage: 8000,
        dailyRate: 60000,
        features: ['GPS', 'Climatisation', 'Camera de recul', 'Bluetooth'],
        locationId: locations[0].id,
        insuranceExpiry: new Date('2025-11-30'),
        technicalInspectionExpiry: new Date('2025-05-31'),
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TG-4567-FIN',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2021,
        type: VehicleType.SEDAN,
        fuelType: FuelType.GASOLINE,
        transmission: Transmission.AUTOMATIC,
        seats: 5,
        color: 'Bleu',
        vin: 'JTDKN3DU5A0000004',
        status: VehicleStatus.IN_USE,
        currentMileage: 62000,
        dailyRate: 35000,
        features: ['Climatisation', 'Bluetooth'],
        locationId: locations[0].id,
        insuranceExpiry: new Date('2025-08-31'),
        technicalInspectionExpiry: new Date('2025-02-28'),
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TG-5678-OPS',
        brand: 'Toyota',
        model: 'Hiace',
        year: 2022,
        type: VehicleType.MINIVAN,
        fuelType: FuelType.DIESEL,
        transmission: Transmission.MANUAL,
        seats: 15,
        color: 'Blanc',
        vin: 'JTDKN3DU5A0000005',
        status: VehicleStatus.AVAILABLE,
        currentMileage: 35000,
        dailyRate: 80000,
        features: ['Climatisation', 'Grande capacite'],
        notes: 'Mini-bus pour missions',
        locationId: locations[0].id,
        insuranceExpiry: new Date('2025-09-30'),
        technicalInspectionExpiry: new Date('2025-03-31'),
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TG-6789-KR',
        brand: 'Nissan',
        model: 'Patrol',
        year: 2020,
        type: VehicleType.SUV,
        fuelType: FuelType.DIESEL,
        transmission: Transmission.AUTOMATIC,
        seats: 7,
        color: 'Argent',
        vin: 'JTDKN3DU5A0000006',
        status: VehicleStatus.MAINTENANCE,
        currentMileage: 98000,
        dailyRate: 70000,
        features: ['GPS', 'Climatisation', '4x4', 'Cuir'],
        notes: 'En maintenance preventive',
        locationId: locations[1].id,
        insuranceExpiry: new Date('2025-07-31'),
        technicalInspectionExpiry: new Date('2025-01-31'),
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TG-7890-SK',
        brand: 'Mitsubishi',
        model: 'L200',
        year: 2021,
        type: VehicleType.PICKUP,
        fuelType: FuelType.DIESEL,
        transmission: Transmission.MANUAL,
        seats: 5,
        color: 'Rouge',
        vin: 'JTDKN3DU5A0000007',
        status: VehicleStatus.AVAILABLE,
        currentMileage: 55000,
        dailyRate: 45000,
        features: ['Climatisation', '4x4', 'Benne'],
        locationId: locations[2].id,
        insuranceExpiry: new Date('2025-12-31'),
        technicalInspectionExpiry: new Date('2025-06-30'),
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TG-8901-HS',
        brand: 'Mercedes-Benz',
        model: 'Classe E',
        year: 2023,
        type: VehicleType.LUXURY,
        fuelType: FuelType.GASOLINE,
        transmission: Transmission.AUTOMATIC,
        seats: 5,
        color: 'Noir',
        vin: 'JTDKN3DU5A0000008',
        status: VehicleStatus.AVAILABLE,
        currentMileage: 5000,
        dailyRate: 120000,
        features: ['GPS', 'Climatisation', 'Cuir', 'Sieges chauffants', 'Toit ouvrant'],
        notes: 'Vehicule VIP',
        locationId: locations[0].id,
        insuranceExpiry: new Date('2025-12-31'),
        technicalInspectionExpiry: new Date('2025-12-31'),
      },
    }),
  ]);

  // Create reservations
  console.log('📅 Creating reservations...');
  const now = new Date();
  const reservations = await Promise.all([
    prisma.reservation.create({
      data: {
        referenceNumber: 'RES-2024-0001',
        userId: users[4].id, // employee
        vehicleId: vehicles[2].id,
        driverId: users[6].id,
        approvedById: users[2].id,
        startDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        purpose: 'Mission terrain - Collecte de donnees',
        destination: 'Kpalime',
        passengers: 3,
        status: ReservationStatus.APPROVED,
      },
    }),
    prisma.reservation.create({
      data: {
        referenceNumber: 'RES-2024-0002',
        userId: users[5].id, // employee2
        vehicleId: vehicles[3].id,
        startDate: now,
        endDate: new Date(now.getTime() + 8 * 60 * 60 * 1000),
        purpose: 'Reunion externe',
        destination: 'Ministere du Plan',
        passengers: 2,
        status: ReservationStatus.IN_PROGRESS,
        startMileage: 62000,
        checkedInAt: now,
      },
    }),
    prisma.reservation.create({
      data: {
        referenceNumber: 'RES-2024-0003',
        userId: users[9].id, // employee3
        vehicleId: vehicles[0].id,
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        purpose: 'Conference regionale',
        destination: 'Kara',
        passengers: 4,
        status: ReservationStatus.PENDING,
      },
    }),
    prisma.reservation.create({
      data: {
        referenceNumber: 'RES-2024-0004',
        userId: users[4].id,
        vehicleId: vehicles[1].id,
        startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        purpose: 'Formation sur le terrain',
        destination: 'Atakpame',
        passengers: 5,
        status: ReservationStatus.COMPLETED,
        startMileage: 44500,
        endMileage: 44850,
        checkedInAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        checkedOutAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        approvedById: users[2].id,
        driverId: users[7].id,
      },
    }),
    prisma.reservation.create({
      data: {
        referenceNumber: 'RES-2024-0005',
        userId: users[5].id,
        vehicleId: vehicles[4].id,
        startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        purpose: 'Transport equipe',
        destination: 'Aeroport de Lome',
        passengers: 10,
        status: ReservationStatus.APPROVED,
        approvedById: users[3].id,
        driverId: users[8].id,
      },
    }),
    prisma.reservation.create({
      data: {
        referenceNumber: 'RES-2024-0006',
        userId: users[9].id,
        vehicleId: vehicles[7].id,
        startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        purpose: 'Accueil delegations',
        destination: 'Lome',
        passengers: 2,
        status: ReservationStatus.PENDING,
      },
    }),
    prisma.reservation.create({
      data: {
        referenceNumber: 'RES-2024-0007',
        userId: users[4].id,
        vehicleId: vehicles[0].id,
        startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
        purpose: 'Visite de terrain',
        destination: 'Tsevie',
        passengers: 3,
        status: ReservationStatus.REJECTED,
        rejectionReason: 'Vehicule deja reserve pour cette periode',
      },
    }),
    prisma.reservation.create({
      data: {
        referenceNumber: 'RES-2024-0008',
        userId: users[5].id,
        vehicleId: vehicles[1].id,
        startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        purpose: 'Livraison materiel',
        destination: 'Sokode',
        passengers: 2,
        status: ReservationStatus.CANCELLED,
        notes: 'Mission annulee',
      },
    }),
    prisma.reservation.create({
      data: {
        referenceNumber: 'RES-2024-0009',
        userId: users[9].id,
        vehicleId: vehicles[6].id,
        startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        purpose: 'Enquete de terrain',
        destination: 'Region des Savanes',
        passengers: 4,
        status: ReservationStatus.APPROVED,
        approvedById: users[2].id,
        driverId: users[6].id,
      },
    }),
    prisma.reservation.create({
      data: {
        referenceNumber: 'RES-2024-0010',
        userId: users[4].id,
        vehicleId: vehicles[4].id,
        startDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
        purpose: 'Atelier regional',
        destination: 'Dapaong',
        passengers: 12,
        status: ReservationStatus.PENDING,
      },
    }),
  ]);

  // Create maintenances
  console.log('🔧 Creating maintenances...');
  await Promise.all([
    prisma.maintenance.create({
      data: {
        vehicleId: vehicles[5].id,
        type: MaintenanceType.PREVENTIVE,
        description: 'Vidange et revision des 100 000 km',
        priority: Priority.MEDIUM,
        status: MaintenanceStatus.IN_PROGRESS,
        scheduledDate: now,
        cost: 250000,
        vendor: 'Toyota Togo',
        createdById: users[1].id,
        assignedToId: users[6].id,
      },
    }),
    prisma.maintenance.create({
      data: {
        vehicleId: vehicles[3].id,
        type: MaintenanceType.INSPECTION,
        description: 'Controle technique annuel',
        priority: Priority.HIGH,
        status: MaintenanceStatus.SCHEDULED,
        scheduledDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        createdById: users[1].id,
      },
    }),
    prisma.maintenance.create({
      data: {
        vehicleId: vehicles[1].id,
        type: MaintenanceType.CORRECTIVE,
        description: 'Remplacement plaquettes de frein',
        priority: Priority.HIGH,
        status: MaintenanceStatus.COMPLETED,
        scheduledDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        completedDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        cost: 85000,
        vendor: 'Auto Parts Lome',
        createdById: users[1].id,
        notes: 'Plaquettes avant et arriere remplacees',
      },
    }),
    prisma.maintenance.create({
      data: {
        vehicleId: vehicles[0].id,
        type: MaintenanceType.PREVENTIVE,
        description: 'Changement pneus',
        priority: Priority.MEDIUM,
        status: MaintenanceStatus.SCHEDULED,
        scheduledDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        cost: 480000,
        vendor: 'Michelin Togo',
        createdById: users[1].id,
      },
    }),
    prisma.maintenance.create({
      data: {
        vehicleId: vehicles[4].id,
        type: MaintenanceType.REPAIR,
        description: 'Reparation climatisation',
        priority: Priority.LOW,
        status: MaintenanceStatus.SCHEDULED,
        scheduledDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        createdById: users[1].id,
      },
    }),
    prisma.maintenance.create({
      data: {
        vehicleId: vehicles[7].id,
        type: MaintenanceType.INSPECTION,
        description: 'Diagnostic electronique',
        priority: Priority.LOW,
        status: MaintenanceStatus.COMPLETED,
        scheduledDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        completedDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        cost: 35000,
        vendor: 'Mercedes Togo',
        createdById: users[1].id,
        notes: 'RAS - Vehicule en bon etat',
      },
    }),
  ]);

  // Create notifications
  console.log('🔔 Creating notifications...');
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: users[4].id,
        type: NotificationType.RESERVATION_APPROVED,
        title: 'Reservation approuvee',
        message: 'Votre demande de reservation RES-2024-0001 a ete approuvee.',
        isRead: true,
        readAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[9].id,
        type: NotificationType.RESERVATION_CREATED,
        title: 'Nouvelle demande',
        message: 'Votre demande de reservation RES-2024-0003 a ete soumise.',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[2].id,
        type: NotificationType.RESERVATION_CREATED,
        title: 'Demande a approuver',
        message: 'Une nouvelle demande de reservation RES-2024-0003 attend votre approbation.',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[1].id,
        type: NotificationType.MAINTENANCE_DUE,
        title: 'Maintenance a venir',
        message: 'Le vehicule TG-4567-FIN a un controle technique prevu dans 15 jours.',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[4].id,
        type: NotificationType.RESERVATION_REMINDER,
        title: 'Rappel de reservation',
        message: 'Votre reservation RES-2024-0001 commence demain.',
        isRead: false,
      },
    }),
  ]);

  // Create settings
  console.log('⚙️ Creating settings...');
  await Promise.all([
    prisma.setting.create({
      data: {
        key: 'app_name',
        value: JSON.parse('"Togo Data Lab - Fleet Management"'),
      },
    }),
    prisma.setting.create({
      data: {
        key: 'max_reservation_days',
        value: JSON.parse('30'),
      },
    }),
    prisma.setting.create({
      data: {
        key: 'require_approval',
        value: JSON.parse('true'),
      },
    }),
    prisma.setting.create({
      data: {
        key: 'working_hours',
        value: JSON.parse('{"start": "08:00", "end": "17:00"}'),
      },
    }),
    prisma.setting.create({
      data: {
        key: 'notification_email',
        value: JSON.parse('"fleet@togodatalab.tg"'),
      },
    }),
  ]);

  // Create holidays
  console.log('📅 Creating holidays...');
  await Promise.all([
    prisma.holiday.create({
      data: {
        name: 'Jour de l\'An',
        date: new Date('2025-01-01'),
        isRecurring: true,
      },
    }),
    prisma.holiday.create({
      data: {
        name: 'Fete de l\'Independance',
        date: new Date('2025-04-27'),
        isRecurring: true,
      },
    }),
    prisma.holiday.create({
      data: {
        name: 'Fete du Travail',
        date: new Date('2025-05-01'),
        isRecurring: true,
      },
    }),
    prisma.holiday.create({
      data: {
        name: 'Noel',
        date: new Date('2025-12-25'),
        isRecurring: true,
      },
    }),
  ]);

  console.log('✅ Database seeding completed successfully!');
  console.log('');
  console.log('📝 Test Credentials:');
  console.log('========================');
  console.log('Super Admin: superadmin@togodatalab.tg / Password@123');
  console.log('Admin: admin@togodatalab.tg / Password@123');
  console.log('Manager: manager@togodatalab.tg / Password@123');
  console.log('Employee: employee@togodatalab.tg / Password@123');
  console.log('Driver: driver@togodatalab.tg / Password@123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
