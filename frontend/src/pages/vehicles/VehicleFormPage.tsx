import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { vehicleService } from '@/services/vehicle.service';
import { useToast } from '@/components/ui/toast';

const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Numero d\'immatriculation requis'),
  brand: z.string().min(1, 'Marque requise'),
  model: z.string().min(1, 'Modele requis'),
  year: z.number().min(1990).max(new Date().getFullYear() + 1),
  type: z.string().min(1, 'Type requis'),
  fuelType: z.enum(['DIESEL', 'GASOLINE', 'ELECTRIC', 'HYBRID']),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']),
  seats: z.number().min(1).max(50),
  color: z.string().optional(),
  vin: z.string().optional(),
  currentMileage: z.number().min(0),
  dailyRate: z.number().min(0).optional(),
  features: z.array(z.string()).optional(),
  notes: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  technicalInspectionExpiry: z.string().optional(),
});

type VehicleForm = z.infer<typeof vehicleSchema>;

const vehicleTypes = [
  { value: 'SEDAN', label: 'Berline' },
  { value: 'SUV', label: 'SUV' },
  { value: 'MINIVAN', label: 'Minivan' },
  { value: 'UTILITY', label: 'Utilitaire' },
  { value: 'PICKUP', label: 'Pickup' },
  { value: 'LUXURY', label: 'Luxe' },
  { value: 'MOTORCYCLE', label: 'Moto' },
];

const fuelTypes = [
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'GASOLINE', label: 'Essence' },
  { value: 'ELECTRIC', label: 'Electrique' },
  { value: 'HYBRID', label: 'Hybride' },
];

const transmissionTypes = [
  { value: 'MANUAL', label: 'Manuelle' },
  { value: 'AUTOMATIC', label: 'Automatique' },
];

export function VehicleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const isEditing = !!id;
  const [photos, setPhotos] = useState<File[]>([]);

  const { data: vehicle, isLoading: loadingVehicle } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehicleService.getVehicle(id!),
    enabled: isEditing,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    values: vehicle
      ? {
          registrationNumber: vehicle.registrationNumber,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          type: vehicle.type,
          fuelType: vehicle.fuelType as any,
          transmission: vehicle.transmission as any,
          seats: vehicle.seats,
          color: vehicle.color || '',
          vin: vehicle.vin || '',
          currentMileage: vehicle.currentMileage,
          dailyRate: vehicle.dailyRate || undefined,
          features: vehicle.features || [],
          notes: vehicle.notes || '',
          insuranceExpiry: vehicle.insuranceExpiry
            ? new Date(vehicle.insuranceExpiry).toISOString().split('T')[0]
            : '',
          technicalInspectionExpiry: vehicle.technicalInspectionExpiry
            ? new Date(vehicle.technicalInspectionExpiry)
                .toISOString()
                .split('T')[0]
            : '',
        }
      : undefined,
  });

  const createMutation = useMutation({
    mutationFn: (data: VehicleForm) => vehicleService.createVehicle(data),
    onSuccess: (newVehicle) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      addToast({
        title: 'Vehicule cree',
        description: 'Le vehicule a ete cree avec succes.',
        type: 'success',
      });
      navigate(`/vehicles/${newVehicle.id}`);
    },
    onError: () => {
      addToast({
        title: 'Erreur',
        description: 'Impossible de creer le vehicule.',
        type: 'error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: VehicleForm) => vehicleService.updateVehicle(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
      addToast({
        title: 'Vehicule mis a jour',
        description: 'Le vehicule a ete mis a jour avec succes.',
        type: 'success',
      });
      navigate(`/vehicles/${id}`);
    },
    onError: () => {
      addToast({
        title: 'Erreur',
        description: 'Impossible de mettre a jour le vehicule.',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: VehicleForm) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  if (isEditing && loadingVehicle) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={isEditing ? `/vehicles/${id}` : '/vehicles'}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Modifier le vehicule' : 'Nouveau vehicule'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? 'Modifiez les informations du vehicule'
              : 'Ajoutez un nouveau vehicule a la flotte'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Informations generales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations generales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Marque *</Label>
                  <Input
                    id="brand"
                    placeholder="Toyota"
                    {...register('brand')}
                  />
                  {errors.brand && (
                    <p className="text-sm text-red-500">{errors.brand.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modele *</Label>
                  <Input
                    id="model"
                    placeholder="Land Cruiser"
                    {...register('model')}
                  />
                  {errors.model && (
                    <p className="text-sm text-red-500">{errors.model.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Immatriculation *</Label>
                  <Input
                    id="registrationNumber"
                    placeholder="TG-1234-AB"
                    {...register('registrationNumber')}
                  />
                  {errors.registrationNumber && (
                    <p className="text-sm text-red-500">
                      {errors.registrationNumber.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Annee *</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="2023"
                    {...register('year', { valueAsNumber: true })}
                  />
                  {errors.year && (
                    <p className="text-sm text-red-500">{errors.year.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <select
                    id="type"
                    className="w-full h-10 px-3 border rounded-md bg-background"
                    {...register('type')}
                  >
                    <option value="">Selectionner...</option>
                    {vehicleTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <p className="text-sm text-red-500">{errors.type.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Couleur</Label>
                  <Input
                    id="color"
                    placeholder="Blanc"
                    {...register('color')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vin">Numero de chassis (VIN)</Label>
                <Input
                  id="vin"
                  placeholder="JTDKN3DU5A0000000"
                  {...register('vin')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Specifications techniques */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications techniques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuelType">Carburant *</Label>
                  <select
                    id="fuelType"
                    className="w-full h-10 px-3 border rounded-md bg-background"
                    {...register('fuelType')}
                  >
                    {fuelTypes.map((fuel) => (
                      <option key={fuel.value} value={fuel.value}>
                        {fuel.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transmission">Transmission *</Label>
                  <select
                    id="transmission"
                    className="w-full h-10 px-3 border rounded-md bg-background"
                    {...register('transmission')}
                  >
                    {transmissionTypes.map((trans) => (
                      <option key={trans.value} value={trans.value}>
                        {trans.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seats">Nombre de places *</Label>
                  <Input
                    id="seats"
                    type="number"
                    placeholder="5"
                    {...register('seats', { valueAsNumber: true })}
                  />
                  {errors.seats && (
                    <p className="text-sm text-red-500">{errors.seats.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentMileage">Kilometrage actuel *</Label>
                  <Input
                    id="currentMileage"
                    type="number"
                    placeholder="50000"
                    {...register('currentMileage', { valueAsNumber: true })}
                  />
                  {errors.currentMileage && (
                    <p className="text-sm text-red-500">
                      {errors.currentMileage.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyRate">Tarif journalier (XOF)</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  placeholder="50000"
                  {...register('dailyRate', { valueAsNumber: true })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insuranceExpiry">Expiration assurance</Label>
                  <Input
                    id="insuranceExpiry"
                    type="date"
                    {...register('insuranceExpiry')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technicalInspectionExpiry">
                    Expiration controle technique
                  </Label>
                  <Input
                    id="technicalInspectionExpiry"
                    type="date"
                    {...register('technicalInspectionExpiry')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Photo ${index + 1}`}
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Ajouter une photo
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Notes additionnelles sur le vehicule..."
              rows={4}
              {...register('notes')}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link to={isEditing ? `/vehicles/${id}` : '/vehicles'}>
            <Button variant="outline" type="button">
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? 'Enregistrement...'
              : isEditing
              ? 'Mettre a jour'
              : 'Creer le vehicule'}
          </Button>
        </div>
      </form>
    </div>
  );
}
