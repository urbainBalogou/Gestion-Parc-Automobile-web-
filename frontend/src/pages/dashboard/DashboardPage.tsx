import { useQuery } from '@tanstack/react-query';
import {
  Car,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardService } from '@/services/dashboard.service';
import { useAuthStore, useHasMinRole } from '@/stores/auth.store';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: { value: number; label: string };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center text-xs text-green-600 mt-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend.value > 0 ? '+' : ''}
            {trend.value}% {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const isManager = useHasMinRole('MANAGER');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    enabled: isManager,
  });

  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ['user-dashboard'],
    queryFn: dashboardService.getUserDashboard,
  });

  const { data: vehiclesByStatus } = useQuery({
    queryKey: ['vehicles-by-status'],
    queryFn: dashboardService.getVehiclesByStatus,
    enabled: isManager,
  });

  const { data: reservationTrends } = useQuery({
    queryKey: ['reservation-trends'],
    queryFn: () => dashboardService.getReservationTrends(30),
    enabled: isManager,
  });

  const { data: maintenanceOverview } = useQuery({
    queryKey: ['maintenance-overview'],
    queryFn: dashboardService.getMaintenanceOverview,
    enabled: isManager,
  });

  if (statsLoading || userStatsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bonjour, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground">
          Voici un apercu de l'activite du systeme.
        </p>
      </div>

      {/* User Stats - Always visible */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Mes Reservations"
          value={userStats?.myReservations || 0}
          icon={Calendar}
        />
        <StatCard
          title="A venir"
          value={userStats?.upcomingReservations || 0}
          icon={Clock}
        />
        <StatCard
          title="Terminees"
          value={userStats?.completedReservations || 0}
          icon={CheckCircle}
        />
        <StatCard
          title="En attente"
          value={userStats?.pendingApproval || 0}
          icon={AlertTriangle}
        />
      </div>

      {/* Admin/Manager Stats */}
      {isManager && stats && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Vehicules"
              value={stats.totalVehicles}
              icon={Car}
              description={`${stats.availableVehicles} disponibles`}
            />
            <StatCard
              title="Reservations Actives"
              value={stats.activeReservations}
              icon={Calendar}
            />
            <StatCard
              title="En attente d'approbation"
              value={stats.pendingApprovals}
              icon={Clock}
            />
            <StatCard
              title="Taux d'utilisation"
              value={`${stats.utilizationRate}%`}
              icon={TrendingUp}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Vehicles by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Vehicules par statut</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vehiclesByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {vehiclesByStatus?.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Reservation Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Reservations (30 derniers jours)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reservationTrends?.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                          })
                        }
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value) =>
                          new Date(value).toLocaleDateString('fr-FR')
                        }
                      />
                      <Bar dataKey="value" fill="#3b82f6" name="Reservations" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Overview */}
          {maintenanceOverview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Apercu Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {maintenanceOverview.scheduled}
                    </p>
                    <p className="text-sm text-muted-foreground">Planifiees</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">
                      {maintenanceOverview.inProgress}
                    </p>
                    <p className="text-sm text-muted-foreground">En cours</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {maintenanceOverview.overdue}
                    </p>
                    <p className="text-sm text-muted-foreground">En retard</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(maintenanceOverview.totalCostThisMonth)}
                    </p>
                    <p className="text-sm text-muted-foreground">Cout ce mois</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
