import api from './api';
import type { ApiResponse, PaginatedResponse, Vehicle } from '@/types';

export interface VehicleFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  fuelType?: string;
  locationId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateVehicleInput {
  registrationNumber: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  status?: string;
  fuelType?: string;
  transmission?: string;
  seats?: number;
  doors?: number;
  color?: string;
  engineCapacity?: number;
  horsePower?: number;
  currentMileage?: number;
  fuelConsumption?: number;
  insuranceExpiry?: string;
  technicalInspectionExpiry?: string;
  locationId?: string;
  dailyRate?: number;
  mileageRate?: number;
  notes?: string;
}

export const vehicleService = {
  async getVehicles(
    filters: VehicleFilters = {}
  ): Promise<PaginatedResponse<Vehicle>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await api.get<PaginatedResponse<Vehicle>>(
      `/vehicles?${params}`
    );
    return response.data;
  },

  async getVehicleById(id: string): Promise<Vehicle> {
    const response = await api.get<ApiResponse<Vehicle>>(`/vehicles/${id}`);
    return response.data.data!;
  },

  async createVehicle(data: CreateVehicleInput): Promise<Vehicle> {
    const response = await api.post<ApiResponse<Vehicle>>('/vehicles', data);
    return response.data.data!;
  },

  async updateVehicle(
    id: string,
    data: Partial<CreateVehicleInput>
  ): Promise<Vehicle> {
    const response = await api.patch<ApiResponse<Vehicle>>(
      `/vehicles/${id}`,
      data
    );
    return response.data.data!;
  },

  async deleteVehicle(id: string): Promise<void> {
    await api.delete(`/vehicles/${id}`);
  },

  async updateVehicleStatus(
    id: string,
    status: string,
    reason?: string
  ): Promise<Vehicle> {
    const response = await api.patch<ApiResponse<Vehicle>>(
      `/vehicles/${id}/status`,
      { status, reason }
    );
    return response.data.data!;
  },

  async updateVehicleMileage(id: string, mileage: number): Promise<Vehicle> {
    const response = await api.patch<ApiResponse<Vehicle>>(
      `/vehicles/${id}/mileage`,
      { mileage }
    );
    return response.data.data!;
  },

  async getAvailableVehicles(
    startDate: string,
    endDate: string,
    type?: string
  ): Promise<Vehicle[]> {
    const params = new URLSearchParams({ startDate, endDate });
    if (type) params.append('type', type);
    const response = await api.get<ApiResponse<Vehicle[]>>(
      `/vehicles/available?${params}`
    );
    return response.data.data!;
  },

  async getVehicleStatistics(id: string): Promise<{
    totalReservations: number;
    completedReservations: number;
    totalMileage: number;
    maintenanceCount: number;
    averageRating: number | null;
  }> {
    const response = await api.get<
      ApiResponse<{
        totalReservations: number;
        completedReservations: number;
        totalMileage: number;
        maintenanceCount: number;
        averageRating: number | null;
      }>
    >(`/vehicles/${id}/statistics`);
    return response.data.data!;
  },

  async toggleFavorite(id: string): Promise<{ isFavorite: boolean }> {
    const response = await api.post<ApiResponse<{ isFavorite: boolean }>>(
      `/vehicles/${id}/favorite`
    );
    return response.data.data!;
  },

  async getFavorites(): Promise<Vehicle[]> {
    const response = await api.get<ApiResponse<Vehicle[]>>('/vehicles/favorites');
    return response.data.data!;
  },

  async uploadPhoto(
    id: string,
    file: File,
    isPrimary = false
  ): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('isPrimary', String(isPrimary));
    const response = await api.post<ApiResponse<{ url: string }>>(
      `/vehicles/${id}/photos`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data.data!;
  },

  async removePhoto(vehicleId: string, photoId: string): Promise<void> {
    await api.delete(`/vehicles/${vehicleId}/photos/${photoId}`);
  },
};
