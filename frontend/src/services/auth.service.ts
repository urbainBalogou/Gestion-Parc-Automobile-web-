import api from './api';
import type { ApiResponse, AuthResponse, User } from '@/types';

export interface LoginInput {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  departmentId?: string;
}

export const authService = {
  async login(data: LoginInput): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      data
    );
    return response.data.data!;
  },

  async register(data: RegisterInput): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      data
    );
    return response.data.data!;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken });
  },

  async logoutAll(): Promise<void> {
    await api.post('/auth/logout-all');
  },

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const response = await api.post<
      ApiResponse<{ accessToken: string; refreshToken: string }>
    >('/auth/refresh', { refreshToken });
    return response.data.data!;
  },

  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },

  async verifyEmail(token: string): Promise<void> {
    await api.post('/auth/verify-email', { token });
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password });
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  async setup2FA(): Promise<{ secret: string; qrCode: string }> {
    const response = await api.post<
      ApiResponse<{ secret: string; qrCode: string }>
    >('/auth/2fa/setup');
    return response.data.data!;
  },

  async enable2FA(code: string): Promise<void> {
    await api.post('/auth/2fa/enable', { code });
  },

  async disable2FA(code: string): Promise<void> {
    await api.post('/auth/2fa/disable', { code });
  },

  async getSessions(): Promise<
    Array<{
      id: string;
      userAgent: string | null;
      ipAddress: string | null;
      createdAt: string;
      updatedAt: string;
    }>
  > {
    const response = await api.get<
      ApiResponse<
        Array<{
          id: string;
          userAgent: string | null;
          ipAddress: string | null;
          createdAt: string;
          updatedAt: string;
        }>
      >
    >('/auth/sessions');
    return response.data.data!;
  },

  async revokeSession(sessionId: string): Promise<void> {
    await api.delete(`/auth/sessions/${sessionId}`);
  },
};
