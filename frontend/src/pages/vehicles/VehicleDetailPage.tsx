import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Car,
  Calendar,
  Fuel,
  Users,
  Gauge,
  MapPin,
  FileText,
  Wrench,
  Heart,
  HeartOff,
  QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { vehicleService } from '@/services/vehicle.service';
import { useHasMinRole } from '@/stores/auth.store';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { VehicleStatus } from '@/types';

const statusColors: Record<VehicleStatus, 'success' | 'info' | 'warning' | 'destructive' | 'secondary'> = {
  AVAILABLE: 'success',
  RESERVED: 'info',
  IN_USE: 'warning',
  MAINTENANCE: 'secondary',
  OUT_OF_SERVICE: 'destructive',
};

const statusLabels: Record<VehicleStatus, string> = {
  AVAILABLE: 'Disponible',
  RESERVED: 'Reserve',
  IN_USE: 'En utilisation',
  MAINTENANCE: 'En maintenance',
  OUT_OF_SERVICE: 'Hors service',
};

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const isAdmin = useHasMinRole('ADMIN');
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehicleService.getVehicle(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => vehicleService.deleteVehicle(id!),
    onSuccess: () => {
      addToast({
        title: 'Vehicule supprime',
        description: 'Le vehicule a ete supprime avec succes.',
        type: 'success',
      });
      navigate('/vehicles');
    },
    onError: () => {
      addToast({
        title: 'Erreur',
        description: 'Impossible de supprimer le vehicule.',
        type: 'error',
      });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: () =>
      vehicle?.isFavorite
        ? vehicleService.removeFromFavorites(id!)
        : vehicleService.addToFavorites(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Vehicule non trouve</h2>
        <p className="text-muted-foreground mb-4">
          Le vehicule demande n'existe pas ou a ete supprime.
        </p>
        <Link to="/vehicles">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux vehicules
          </Button>
        </Link>
      </div>
    );
  }

  const photos = vehicle.photos || [];
  const primaryPhoto = photos[selectedPhoto] || photos[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/vehicles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-muted-foreground">
              {vehicle.registrationNumber} - {vehicle.year}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => favoriteMutation.mutate()}
          >
            {vehicle.isFavorite ? (
              <Heart className="h-5 w-5 fill-red-500 text-red-500" />
            ) : (
              <HeartOff className="h-5 w-5" />
            )}
          </Button>
          {isAdmin && (
            <>
              <Link to={`/vehicles/${id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </Link>
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmer la suppression</DialogTitle>
                    <DialogDescription>
                      Etes-vous sur de vouloir supprimer ce vehicule? Cette
                      action est irreversible.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Photos */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-100 relative overflow-hidden rounded-t-lg">
                {primaryPhoto ? (
                  <img
                    src={primaryPhoto.url}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="h-24 w-24 text-gray-400" />
                  </div>
                )}
                <Badge
                  variant={statusColors[vehicle.status]}
                  className="absolute top-4 right-4"
                >
                  {statusLabels[vehicle.status]}
                </Badge>
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhoto(index)}
                      className={`w-20 h-14 rounded overflow-hidden flex-shrink-0 border-2 ${
                        index === selectedPhoto
                          ? 'border-primary'
                          : 'border-transparent'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="reservations">Reservations</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Car className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="font-medium">{vehicle.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Places</p>
                        <p className="font-medium">{vehicle.seats}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Fuel className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Carburant
                        </p>
                        <p className="font-medium">
                          {vehicle.fuelType === 'DIESEL' ? 'Diesel' : 'Essence'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Gauge className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Kilometrage
                        </p>
                        <p className="font-medium">
                          {vehicle.currentMileage.toLocaleString()} km
                        </p>
                      </div>
                    </div>
                    {vehicle.location && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Emplacement
                          </p>
                          <p className="font-medium">{vehicle.location.name}</p>
                        </div>
                      </div>
                    )}
                    {vehicle.qrCode && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <QrCode className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Code QR
                          </p>
                          <p className="font-medium font-mono">
                            {vehicle.qrCode}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {vehicle.features && vehicle.features.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Equipements</h4>
                      <div className="flex flex-wrap gap-2">
                        {vehicle.features.map((feature, index) => (
                          <Badge key={index} variant="secondary">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {vehicle.notes && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-muted-foreground">{vehicle.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reservations" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    Historique des reservations a venir...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    Historique de maintenance a venir...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    Documents du vehicule a venir...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tarification</CardTitle>
            </CardHeader>
            <CardContent>
              {vehicle.dailyRate ? (
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(vehicle.dailyRate)}
                  </p>
                  <p className="text-muted-foreground">par jour</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center">
                  Tarif non defini
                </p>
              )}
              <Link to={`/reservations/new?vehicle=${id}`} className="block mt-4">
                <Button className="w-full" disabled={vehicle.status !== 'AVAILABLE'}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Reserver ce vehicule
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dates importantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vehicle.insuranceExpiry && (
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Expiration assurance
                    </p>
                    <p className="font-medium">
                      {formatDate(vehicle.insuranceExpiry)}
                    </p>
                  </div>
                </div>
              )}
              {vehicle.technicalInspectionExpiry && (
                <div className="flex items-center gap-3">
                  <Wrench className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Expiration controle technique
                    </p>
                    <p className="font-medium">
                      {formatDate(vehicle.technicalInspectionExpiry)}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Ajoute le
                  </p>
                  <p className="font-medium">
                    {formatDate(vehicle.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
