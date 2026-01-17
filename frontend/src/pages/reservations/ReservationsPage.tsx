import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Car,
  Clock,
  MapPin,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { reservationService } from '@/services/reservation.service';
import { useAuthStore, useHasMinRole } from '@/stores/auth.store';
import { formatDate, cn } from '@/lib/utils';
import type { ReservationStatus } from '@/types';

const statusColors: Record<ReservationStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  PENDING: 'warning',
  APPROVED: 'info',
  REJECTED: 'destructive',
  IN_PROGRESS: 'success',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
};

const statusLabels: Record<ReservationStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvee',
  REJECTED: 'Rejetee',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminee',
  CANCELLED: 'Annulee',
};

export function ReservationsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const user = useAuthStore((state) => state.user);
  const isManager = useHasMinRole('MANAGER');

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', { page, search, status: statusFilter }],
    queryFn: () =>
      reservationService.getReservations({
        page,
        limit: 10,
        search,
        status: statusFilter,
      }),
  });

  const { data: pendingData } = useQuery({
    queryKey: ['reservations', 'pending'],
    queryFn: () =>
      reservationService.getReservations({
        page: 1,
        limit: 100,
        status: 'PENDING',
      }),
    enabled: isManager,
  });

  const pendingCount = pendingData?.meta?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>
          <p className="text-muted-foreground">
            Gerez les reservations de vehicules.
          </p>
        </div>
        <Button asChild>
          <Link to="/reservations/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle reservation
          </Link>
        </Button>
      </div>

      {/* Tabs for managers */}
      {isManager && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              En attente
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="my">Mes reservations</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par reference, vehicule, utilisateur..."
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              className="h-10 px-3 border rounded-md bg-background"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="APPROVED">Approuvee</option>
              <option value="REJECTED">Rejetee</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="COMPLETED">Terminee</option>
              <option value="CANCELLED">Annulee</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner" />
        </div>
      ) : data?.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Aucune reservation trouvee</h3>
            <p className="text-muted-foreground mb-4">
              Essayez de modifier vos filtres ou creez une nouvelle reservation.
            </p>
            <Button asChild>
              <Link to="/reservations/new">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle reservation
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data?.data.map((reservation) => (
            <Link key={reservation.id} to={`/reservations/${reservation.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Vehicle info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {reservation.vehicle?.photos?.[0] ? (
                          <img
                            src={reservation.vehicle.photos[0].url}
                            alt={`${reservation.vehicle.brand} ${reservation.vehicle.model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {reservation.vehicle?.brand} {reservation.vehicle?.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {reservation.referenceNumber}
                        </p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatDate(reservation.startDate)} -{' '}
                        {formatDate(reservation.endDate)}
                      </span>
                    </div>

                    {/* User */}
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {reservation.user?.firstName} {reservation.user?.lastName}
                      </span>
                    </div>

                    {/* Destination */}
                    {reservation.destination && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">
                          {reservation.destination}
                        </span>
                      </div>
                    )}

                    {/* Status */}
                    <Badge variant={statusColors[reservation.status]}>
                      {statusLabels[reservation.status]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={!data.meta.hasPrev}
            onClick={() => setPage((p) => p - 1)}
          >
            Precedent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.meta.page} sur {data.meta.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={!data.meta.hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
