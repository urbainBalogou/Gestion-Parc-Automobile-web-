import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Plus,
  Search,
  Car,
  Calendar,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useHasMinRole } from '@/stores/auth.store';
import { useToast } from '@/components/ui/toast';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import api from '@/services/api';

interface Maintenance {
  id: string;
  type: string;
  description: string;
  scheduledDate: string;
  completedDate?: string;
  cost?: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  vehicle: {
    id: string;
    brand: string;
    model: string;
    registrationNumber: string;
  };
}

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  SCHEDULED: 'secondary',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'destructive',
};

const statusLabels: Record<string, string> = {
  SCHEDULED: 'Planifiee',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminee',
  CANCELLED: 'Annulee',
};

const priorityColors: Record<string, string> = {
  LOW: 'text-green-600 bg-green-50',
  MEDIUM: 'text-yellow-600 bg-yellow-50',
  HIGH: 'text-orange-600 bg-orange-50',
  URGENT: 'text-red-600 bg-red-50',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  URGENT: 'Urgente',
};

const maintenanceTypes = [
  { value: 'OIL_CHANGE', label: 'Vidange' },
  { value: 'TIRE_CHANGE', label: 'Changement de pneus' },
  { value: 'BRAKE_SERVICE', label: 'Freinage' },
  { value: 'INSPECTION', label: 'Inspection' },
  { value: 'REPAIR', label: 'Reparation' },
  { value: 'OTHER', label: 'Autre' },
];

export function MaintenancePage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isAdmin = useHasMinRole('ADMIN');
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    vehicleId: '',
    type: 'OIL_CHANGE',
    description: '',
    scheduledDate: '',
    priority: 'MEDIUM',
    estimatedCost: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['maintenances', { page, search, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const response = await api.get(`/maintenance?${params}`);
      return response.data;
    },
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles', 'all'],
    queryFn: async () => {
      const response = await api.get('/vehicles?limit=100');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/maintenance', {
        ...data,
        estimatedCost: data.estimatedCost ? Number(data.estimatedCost) : undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      setDialogOpen(false);
      setFormData({
        vehicleId: '',
        type: 'OIL_CHANGE',
        description: '',
        scheduledDate: '',
        priority: 'MEDIUM',
        estimatedCost: '',
      });
      addToast({
        title: 'Maintenance planifiee',
        description: 'La maintenance a ete planifiee avec succes.',
        type: 'success',
      });
    },
    onError: () => {
      addToast({
        title: 'Erreur',
        description: 'Impossible de creer la maintenance.',
        type: 'error',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground">
            Gerez les maintenances des vehicules.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Planifier une maintenance
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Wrench className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {data?.data?.filter((m: Maintenance) => m.status === 'SCHEDULED').length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Planifiees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wrench className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {data?.data?.filter((m: Maintenance) => m.status === 'IN_PROGRESS').length || 0}
                </p>
                <p className="text-sm text-muted-foreground">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {data?.data?.filter((m: Maintenance) => m.priority === 'URGENT').length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Urgentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    data?.data?.reduce(
                      (sum: number, m: Maintenance) => sum + (m.cost || 0),
                      0
                    ) || 0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Cout total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par vehicule, description..."
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
              <option value="SCHEDULED">Planifiee</option>
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
      ) : data?.data?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Aucune maintenance trouvee</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos filtres de recherche.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data?.data?.map((maintenance: Maintenance) => (
            <Card key={maintenance.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-muted rounded-lg">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {maintenanceTypes.find((t) => t.value === maintenance.type)?.label ||
                            maintenance.type}
                        </p>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            priorityColors[maintenance.priority]
                          )}
                        >
                          {priorityLabels[maintenance.priority]}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {maintenance.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <Link
                      to={`/vehicles/${maintenance.vehicle.id}`}
                      className="hover:text-primary"
                    >
                      {maintenance.vehicle.brand} {maintenance.vehicle.model}
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(maintenance.scheduledDate)}</span>
                  </div>

                  {maintenance.cost && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{formatCurrency(maintenance.cost)}</span>
                    </div>
                  )}

                  <Badge variant={statusColors[maintenance.status]}>
                    {statusLabels[maintenance.status]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.meta?.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={!data.meta?.hasPrev}
            onClick={() => setPage((p) => p - 1)}
          >
            Precedent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.meta?.page} sur {data.meta?.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={!data.meta?.hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Planifier une maintenance</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleId">Vehicule *</Label>
              <select
                id="vehicleId"
                className="w-full h-10 px-3 border rounded-md bg-background"
                value={formData.vehicleId}
                onChange={(e) =>
                  setFormData({ ...formData, vehicleId: e.target.value })
                }
                required
              >
                <option value="">Selectionner un vehicule</option>
                {vehicles?.data?.map((vehicle: any) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} - {vehicle.registrationNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  className="w-full h-10 px-3 border rounded-md bg-background"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  {maintenanceTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priorite *</Label>
                <select
                  id="priority"
                  className="w-full h-10 px-3 border rounded-md bg-background"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                >
                  <option value="LOW">Basse</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Haute</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Date planifiee *</Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Description de la maintenance..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Cout estime (XOF)</Label>
              <Input
                id="estimatedCost"
                type="number"
                placeholder="50000"
                value={formData.estimatedCost}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedCost: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creation...' : 'Planifier'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
