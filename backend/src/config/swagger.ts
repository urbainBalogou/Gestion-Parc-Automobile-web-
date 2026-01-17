import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vehicle Reservation Management System API',
      version: '1.0.0',
      description: `
        API for the Vehicle Reservation Management System - Togo Data Lab

        ## Features
        - User authentication with JWT & refresh tokens
        - Two-factor authentication (2FA)
        - Vehicle management with photos and documents
        - Reservation workflow with approval process
        - Maintenance tracking
        - Real-time notifications
        - Dashboard and analytics

        ## Authentication
        All protected endpoints require a Bearer token in the Authorization header:
        \`Authorization: Bearer <access_token>\`

        ## Roles
        - **SUPER_ADMIN**: Full system access
        - **ADMIN**: Manage vehicles, users, and reservations
        - **MANAGER**: Approve reservations, view statistics
        - **EMPLOYEE**: Create and manage own reservations
        - **DRIVER**: View assigned reservations
      `,
      contact: {
        name: 'Togo Data Lab',
        email: 'contact@togodatalab.tg',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            code: {
              type: 'string',
              example: 'ERROR_CODE',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalPages: { type: 'integer' },
                hasNext: { type: 'boolean' },
                hasPrev: { type: 'boolean' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
            avatar: { type: 'string' },
            role: {
              type: 'string',
              enum: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'DRIVER'],
            },
            isActive: { type: 'boolean' },
            isEmailVerified: { type: 'boolean' },
            twoFactorEnabled: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Vehicle: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            registrationNumber: { type: 'string' },
            brand: { type: 'string' },
            model: { type: 'string' },
            year: { type: 'integer' },
            type: {
              type: 'string',
              enum: ['SEDAN', 'SUV', 'MINIVAN', 'UTILITY', 'PICKUP', 'LUXURY', 'MOTORCYCLE'],
            },
            status: {
              type: 'string',
              enum: ['AVAILABLE', 'RESERVED', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE'],
            },
            seats: { type: 'integer' },
            currentMileage: { type: 'integer' },
            fuelType: {
              type: 'string',
              enum: ['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG'],
            },
          },
        },
        Reservation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            referenceNumber: { type: 'string' },
            vehicleId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            purpose: { type: 'string' },
            destination: { type: 'string' },
            status: {
              type: 'string',
              enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Vehicles', description: 'Vehicle management endpoints' },
      { name: 'Reservations', description: 'Reservation management endpoints' },
      { name: 'Maintenances', description: 'Maintenance tracking endpoints' },
      { name: 'Notifications', description: 'Notification endpoints' },
      { name: 'Dashboard', description: 'Dashboard and analytics endpoints' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
