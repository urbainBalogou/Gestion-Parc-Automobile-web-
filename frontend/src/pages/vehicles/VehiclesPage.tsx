import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Car,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Fuel,
  Users,
  Gauge,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { vehicleService } from '@/services/vehicle.service';
import { useHasMinRole } from '@/stores/auth.store';
import { cn, formatCurrency } from '@/lib/utils';
import type { Vehicle, VehicleStatus } from '@/types';

const statusColors: Record<VehicleStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  RESERVED: 'bg-blue-100 text-blue-800',
  IN_USE: 'bg-yellow-100 text-yellow-800',
  MAINTENANCE: 'bg-orange-100 text-orange-800',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800',
};

const statusLabels: Record<VehicleStatus, string> = {
  AVAILABLE: 'Disponible',
  RESERVED: 'Reserve',
  IN_USE: 'En utilisation',
  MAINTENANCE: 'En maintenance',
  OUT_OF_SERVICE: 'Hors service',
};

const typeLabels: Record<string, string> = {
  SEDAN: 'Berline',
  SUV: 'SUV',
  MINIVAN: 'Minivan',
  UTILITY: 'Utilitaire',
  PICKUP: 'Pickup',
  LUXURY: 'Luxe',
  MOTORCYCLE: 'Moto',
};

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const primaryPhoto = vehicle.photos.find((p) => p.isPrimary) || vehicle.photos[0];

  return (
    <Link to={`/vehicles/${vehicle.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <div className="aspect-video bg-gray-100 relative overflow-hidden rounded-t-lg">
          {primaryPhoto ? (
            <img
              src={primaryPhoto.url}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="h-16 w-16 text-gray-400" />
            </div>
          )}
          <span
            className={cn(
              'absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium',
              statusColors[vehicle.status]
            )}
          >
            {statusLabels[vehicle.status]}
          </span>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg">
            {vehicle.brand} {vehicle.model}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {vehicle.registrationNumber} - {vehicle.year}
          </p>

          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {vehicle.seats} places
            </div>
            <div className="flex items-center gap-1">
              <Fuel className="h-3 w-3" />
              {vehicle.fuelType === 'DIESEL' ? 'Diesel' : 'Essence'}
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              {vehicle.currentMileage.toLocaleString()} km
            </div>
          </div>

          {vehicle.dailyRate && (
            <p className="mt-3 text-sm font-medium text-primary">
              {formatCurrency(vehicle.dailyRate)}/jour
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function VehicleRow({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link
      to={`/vehicles/${vehicle.id}`}
      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
    >
      <div className="w-20 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
        {vehicle.photos[0] ? (
          <img
            src={vehicle.photos[0].url}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">
          {vehicle.brand} {vehicle.model}
        </h3>
        <p className="text-sm text-muted-foreground">
          {vehicle.registrationNumber}
        </p>
      </div>

      <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
        <span>{typeLabels[vehicle.type]}</span>
        <span>{vehicle.seats} places</span>
        <span>{vehicle.currentMileage.toLocaleString()} km</span>
      </div>

      <span
        className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          statusColors[vehicle.status]
        )}
      >
        {statusLabels[vehicle.status]}
      </span>
    </Link>
  );
}

export function VehiclesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const isAdmin = useHasMinRole('ADMIN');

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', { page, search, status: statusFilter }],
    queryFn: () =>
      vehicleService.getVehicles({
        page,
        limit: 12,
        search,
        status: statusFilter,
      }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicules</h1>
          <p className="text-muted-foreground">
            Gerez le parc automobile de l'organisation.
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link to="/vehicles/new">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un vehicule
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par marque, modele, immatriculation..."
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
              <option value="AVAILABLE">Disponible</option>
              <option value="RESERVED">Reserve</option>
              <option value="IN_USE">En utilisation</option>
              <option value="MAINTENANCE">En maintenance</option>
              <option value="OUT_OF_SERVICE">Hors service</option>
            </select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
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
            <Car className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Aucun vehicule trouve</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos filtres de recherche.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.data.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {data?.data.map((vehicle) => (
            <VehicleRow key={vehicle.id} vehicle={vehicle} />
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
