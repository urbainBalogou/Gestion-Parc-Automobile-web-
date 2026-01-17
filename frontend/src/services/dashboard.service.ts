import api from './api';
import type { ApiResponse, DashboardStats, ChartData } from '@/types';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<ApiResponse<DashboardStats>>(
      '/dashboard/stats'
    );
    return response.data.data!;
  },

  async getUserDashboard(): Promise<{
    myReservations: number;
    upcomingReservations: number;
    completedReservations: number;
    pendingApproval: number;
  }> {
    const response = await api.get<
      ApiResponse<{
        myReservations: number;
        upcomingReservations: number;
        completedReservations: number;
        pendingApproval: number;
      }>
    >('/dashboard/user');
    return response.data.data!;
  },

  async getReservationTrends(days = 30): Promise<ChartData[]> {
    const response = await api.get<ApiResponse<ChartData[]>>(
      `/dashboard/reservation-trends?days=${days}`
    );
    return response.data.data!;
  },

  async getVehicleUtilization(): Promise<ChartData[]> {
    const response = await api.get<ApiResponse<ChartData[]>>(
      '/dashboard/vehicle-utilization'
    );
    return response.data.data!;
  },

  async getReservationsByStatus(): Promise<ChartData[]> {
    const response = await api.get<ApiResponse<ChartData[]>>(
      '/dashboard/reservations-by-status'
    );
    return response.data.data!;
  },

  async getReservationsByDepartment(): Promise<ChartData[]> {
    const response = await api.get<ApiResponse<ChartData[]>>(
      '/dashboard/reservations-by-department'
    );
    return response.data.data!;
  },

  async getVehiclesByType(): Promise<ChartData[]> {
    const response = await api.get<ApiResponse<ChartData[]>>(
      '/dashboard/vehicles-by-type'
    );
    return response.data.data!;
  },

  async getVehiclesByStatus(): Promise<ChartData[]> {
    const response = await api.get<ApiResponse<ChartData[]>>(
      '/dashboard/vehicles-by-status'
    );
    return response.data.data!;
  },

  async getTopUsers(
    limit = 10
  ): Promise<
    Array<{
      id: string;
      name: string;
      email: string;
      reservationCount: number;
      department: string | null;
    }>
  > {
    const response = await api.get<
      ApiResponse<
        Array<{
          id: string;
          name: string;
          email: string;
          reservationCount: number;
          department: string | null;
        }>
      >
    >(`/dashboard/top-users?limit=${limit}`);
    return response.data.data!;
  },

  async getMonthlyStats(
    months = 12
  ): Promise<
    Array<{
      month: string;
      reservations: number;
      completedReservations: number;
      revenue: number;
    }>
  > {
    const response = await api.get<
      ApiResponse<
        Array<{
          month: string;
          reservations: number;
          completedReservations: number;
          revenue: number;
        }>
      >
    >(`/dashboard/monthly-stats?months=${months}`);
    return response.data.data!;
  },

  async getMaintenanceOverview(): Promise<{
    scheduled: number;
    inProgress: number;
    overdue: number;
    totalCostThisMonth: number;
  }> {
    const response = await api.get<
      ApiResponse<{
        scheduled: number;
        inProgress: number;
        overdue: number;
        totalCostThisMonth: number;
      }>
    >('/dashboard/maintenance-overview');
    return response.data.data!;
  },

  async getRecentActivity(
    limit = 20
  ): Promise<
    Array<{
      type: string;
      action: string;
      entityType: string;
      entityId: string;
      userId: string;
      userName: string;
      timestamp: string;
    }>
  > {
    const response = await api.get<
      ApiResponse<
        Array<{
          type: string;
          action: string;
          entityType: string;
          entityId: string;
          userId: string;
          userName: string;
          timestamp: string;
        }>
      >
    >(`/dashboard/recent-activity?limit=${limit}`);
    return response.data.data!;
  },

  async getExpiringDocuments(
    days = 30
  ): Promise<
    Array<{
      vehicleId: string;
      vehicleName: string;
      registrationNumber: string;
      documentType: string;
      expiryDate: string;
      daysUntilExpiry: number;
    }>
  > {
    const response = await api.get<
      ApiResponse<
        Array<{
          vehicleId: string;
          vehicleName: string;
          registrationNumber: string;
          documentType: string;
          expiryDate: string;
          daysUntilExpiry: number;
        }>
      >
    >(`/dashboard/expiring-documents?days=${days}`);
    return response.data.data!;
  },
};
