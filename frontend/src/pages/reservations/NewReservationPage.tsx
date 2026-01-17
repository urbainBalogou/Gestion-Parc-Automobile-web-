import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Car, Calendar, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { vehicleService } from '@/services/vehicle.service';
import { reservationService } from '@/services/reservation.service';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils';

const reservationSchema = z.object({
  vehicleId: z.string().min(1, 'Veuillez selectionner un vehicule'),
  startDate: z.string().min(1, 'Date de debut requise'),
  endDate: z.string().min(1, 'Date de fin requise'),
  destination: z.string().min(1, 'Destination requise'),
  purpose: z.string().min(1, 'Motif requis'),
  passengers: z.number().min(0).optional(),
  needsDriver: z.boolean().optional(),
  notes: z.string().optional(),
});

type ReservationForm = z.infer<typeof reservationSchema>;

export function NewReservationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const preselectedVehicleId = searchParams.get('vehicle');

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    preselectedVehicleId || ''
  );

  const { data: vehicles, isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles', 'available'],
    queryFn: () =>
      vehicleService.getVehicles({
        page: 1,
        limit: 100,
        status: 'AVAILABLE',
      }),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReservationForm>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      vehicleId: preselectedVehicleId || '',
      needsDriver: false,
      passengers: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ReservationForm) =>
      reservationService.createReservation({
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      }),
    onSuccess: (reservation) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      addToast({
        title: 'Reservation creee',
        description: 'Votre demande de reservation a ete soumise avec succes.',
        type: 'success',
      });
      navigate(`/reservations/${reservation.id}`);
    },
    onError: () => {
      addToast({
        title: 'Erreur',
        description: 'Impossible de creer la reservation.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: ReservationForm) => {
    createMutation.mutate(data);
  };

  const watchedVehicleId = watch('vehicleId');
  const selectedVehicle = vehicles?.data.find((v) => v.id === watchedVehicleId);

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const days =
    startDate && endDate
      ? Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 0;
  const estimatedCost =
    selectedVehicle?.dailyRate && days > 0
      ? selectedVehicle.dailyRate * days
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/reservations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nouvelle reservation</h1>
          <p className="text-muted-foreground">
            Reservez un vehicule pour votre mission
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicule
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingVehicles ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="loading-spinner" />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {vehicles?.data.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        onClick={() => setValue('vehicleId', vehicle.id)}
                        className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                          watchedVehicleId === vehicle.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
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
                          <p className="font-medium truncate">
                            {vehicle.brand} {vehicle.model}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.seats} places -{' '}
                            {vehicle.fuelType === 'DIESEL' ? 'Diesel' : 'Essence'}
                          </p>
                          {vehicle.dailyRate && (
                            <p className="text-sm text-primary font-medium">
                              {formatCurrency(vehicle.dailyRate)}/jour
                            </p>
                          )}
                        </div>
                        <input
                          type="radio"
                          name="vehicleId"
                          value={vehicle.id}
                          checked={watchedVehicleId === vehicle.id}
                          onChange={() => {}}
                          className="sr-only"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {errors.vehicleId && (
                  <p className="text-sm text-red-500 mt-2">
                    {errors.vehicleId.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Date et heure de debut *</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      {...register('startDate')}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-red-500">
                        {errors.startDate.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Date et heure de fin *</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      {...register('endDate')}
                    />
                    {errors.endDate && (
                      <p className="text-sm text-red-500">
                        {errors.endDate.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Details de la mission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination *</Label>
                  <Input
                    id="destination"
                    placeholder="Ex: Kara, Atakpame, Sokode..."
                    {...register('destination')}
                  />
                  {errors.destination && (
                    <p className="text-sm text-red-500">
                      {errors.destination.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Motif de la mission *</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Decrivez brievement le but de votre deplacement..."
                    rows={3}
                    {...register('purpose')}
                  />
                  {errors.purpose && (
                    <p className="text-sm text-red-500">
                      {errors.purpose.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="passengers">Nombre de passagers</Label>
                    <Input
                      id="passengers"
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register('passengers', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Besoin d'un chauffeur?</Label>
                    <div className="flex items-center gap-4 h-10">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          {...register('needsDriver')}
                        />
                        <span>Oui, je souhaite un chauffeur</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes additionnelles</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informations complementaires..."
                    rows={2}
                    {...register('notes')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Recapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedVehicle ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-9 bg-gray-100 rounded overflow-hidden">
                        {selectedVehicle.photos[0] ? (
                          <img
                            src={selectedVehicle.photos[0].url}
                            alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {selectedVehicle.brand} {selectedVehicle.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedVehicle.registrationNumber}
                        </p>
                      </div>
                    </div>
                    <hr />
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Aucun vehicule selectionne
                  </p>
                )}

                {days > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duree</span>
                    <span>{days} jour(s)</span>
                  </div>
                )}

                {selectedVehicle?.dailyRate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tarif journalier
                    </span>
                    <span>{formatCurrency(selectedVehicle.dailyRate)}</span>
                  </div>
                )}

                {estimatedCost > 0 && (
                  <>
                    <hr />
                    <div className="flex justify-between font-medium">
                      <span>Cout estime</span>
                      <span className="text-primary">
                        {formatCurrency(estimatedCost)}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? 'Envoi en cours...'
                : 'Soumettre la demande'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Votre demande sera examinee par un responsable avant approbation.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
