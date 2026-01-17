import api from './api';
import type { ApiResponse, PaginatedResponse, Reservation } from '@/types';

export interface ReservationFilters {
  page?: number;
  limit?: number;
  status?: string;
  vehicleId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateReservationInput {
  vehicleId: string;
  startDate: string;
  endDate: string;
  purpose: string;
  destination: string;
  passengerCount?: number;
  estimatedMileage?: number;
  needsDriver?: boolean;
  driverId?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
}

export const reservationService = {
  async getReservations(
    filters: ReservationFilters = {}
  ): Promise<PaginatedResponse<Reservation>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await api.get<PaginatedResponse<Reservation>>(
      `/reservations?${params}`
    );
    return response.data;
  },

  async getReservationById(id: string): Promise<Reservation> {
    const response = await api.get<ApiResponse<Reservation>>(
      `/reservations/${id}`
    );
    return response.data.data!;
  },

  async createReservation(data: CreateReservationInput): Promise<Reservation> {
    const response = await api.post<ApiResponse<Reservation>>(
      '/reservations',
      data
    );
    return response.data.data!;
  },

  async updateReservation(
    id: string,
    data: Partial<CreateReservationInput>
  ): Promise<Reservation> {
    const response = await api.patch<ApiResponse<Reservation>>(
      `/reservations/${id}`,
      data
    );
    return response.data.data!;
  },

  async approveReservation(
    id: string,
    comment?: string
  ): Promise<Reservation> {
    const response = await api.post<ApiResponse<Reservation>>(
      `/reservations/${id}/approve`,
      { comment }
    );
    return response.data.data!;
  },

  async rejectReservation(id: string, reason: string): Promise<Reservation> {
    const response = await api.post<ApiResponse<Reservation>>(
      `/reservations/${id}/reject`,
      { reason }
    );
    return response.data.data!;
  },

  async cancelReservation(id: string, reason: string): Promise<Reservation> {
    const response = await api.post<ApiResponse<Reservation>>(
      `/reservations/${id}/cancel`,
      { reason }
    );
    return response.data.data!;
  },

  async checkIn(
    id: string,
    mileage: number,
    notes?: string
  ): Promise<Reservation> {
    const response = await api.post<ApiResponse<Reservation>>(
      `/reservations/${id}/check-in`,
      { mileage, notes }
    );
    return response.data.data!;
  },

  async checkOut(
    id: string,
    data: {
      mileage: number;
      notes?: string;
      rating?: number;
      feedback?: string;
    }
  ): Promise<Reservation> {
    const response = await api.post<ApiResponse<Reservation>>(
      `/reservations/${id}/check-out`,
      data
    );
    return response.data.data!;
  },

  async getUpcomingReservations(): Promise<Reservation[]> {
    const response = await api.get<ApiResponse<Reservation[]>>(
      '/reservations/upcoming'
    );
    return response.data.data!;
  },

  async getActiveReservations(): Promise<Reservation[]> {
    const response = await api.get<ApiResponse<Reservation[]>>(
      '/reservations/active'
    );
    return response.data.data!;
  },

  async getCalendarReservations(
    startDate: string,
    endDate: string,
    vehicleId?: string
  ): Promise<Reservation[]> {
    const params = new URLSearchParams({ startDate, endDate });
    if (vehicleId) params.append('vehicleId', vehicleId);
    const response = await api.get<ApiResponse<Reservation[]>>(
      `/reservations/calendar?${params}`
    );
    return response.data.data!;
  },
};
