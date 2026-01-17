import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/auth.store';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { VehiclesPage } from '@/pages/vehicles/VehiclesPage';
import { VehicleDetailPage } from '@/pages/vehicles/VehicleDetailPage';
import { VehicleFormPage } from '@/pages/vehicles/VehicleFormPage';
import { ReservationsPage } from '@/pages/reservations/ReservationsPage';
import { ReservationDetailPage } from '@/pages/reservations/ReservationDetailPage';
import { NewReservationPage } from '@/pages/reservations/NewReservationPage';
import { CalendarPage } from '@/pages/calendar/CalendarPage';
import { MaintenancePage } from '@/pages/maintenance/MaintenancePage';
import { UsersPage } from '@/pages/users/UsersPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <DashboardLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />

              {/* Vehicles */}
              <Route path="vehicles" element={<VehiclesPage />} />
              <Route path="vehicles/new" element={<VehicleFormPage />} />
              <Route path="vehicles/:id" element={<VehicleDetailPage />} />
              <Route path="vehicles/:id/edit" element={<VehicleFormPage />} />

              {/* Reservations */}
              <Route path="reservations" element={<ReservationsPage />} />
              <Route path="reservations/new" element={<NewReservationPage />} />
              <Route path="reservations/:id" element={<ReservationDetailPage />} />

              {/* Calendar */}
              <Route path="calendar" element={<CalendarPage />} />

              {/* Maintenance */}
              <Route path="maintenance" element={<MaintenancePage />} />

              {/* Users */}
              <Route path="users" element={<UsersPage />} />

              {/* Profile */}
              <Route path="profile" element={<ProfilePage />} />

              {/* Settings */}
              <Route path="settings" element={<SettingsPage />} />

              {/* Notifications */}
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
