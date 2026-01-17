import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Car,
  Calendar,
  MapPin,
  User,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Play,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { reservationService } from '@/services/reservation.service';
import { useHasMinRole } from '@/stores/auth.store';
import { useToast } from '@/components/ui/toast';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
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

export function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const isManager = useHasMinRole('MANAGER');
  const isAdmin = useHasMinRole('ADMIN');

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
  const [mileage, setMileage] = useState('');

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', id],
    queryFn: () => reservationService.getReservation(id!),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => reservationService.approveReservation(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      addToast({
        title: 'Reservation approuvee',
        description: 'La reservation a ete approuvee avec succes.',
        type: 'success',
      });
    },
    onError: () => {
      addToast({
        title: 'Erreur',
        description: 'Impossible d\'approuver la reservation.',
        type: 'error',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) =>
      reservationService.rejectReservation(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      setRejectDialogOpen(false);
      setRejectReason('');
      addToast({
        title: 'Reservation rejetee',
        description: 'La reservation a ete rejetee.',
        type: 'success',
      });
    },
    onError: () => {
      addToast({
        title: 'Erreur',
        description: 'Impossible de rejeter la reservation.',
        type: 'error',
      });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: (startMileage: number) =>
      reservationService.checkIn(id!, startMileage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      setCheckInDialogOpen(false);
      setMileage('');
      addToast({
        title: 'Depart enregistre',
        description: 'Le depart a ete enregistre avec succes.',
        type: 'success',
      });
    },
    onError: () => {
      addToast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer le depart.',
        type: 'error',
      });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: (endMileage: number) =>
      reservationService.checkOut(id!, endMileage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      setCheckOutDialogOpen(false);
      setMileage('');
      addToast({
        title: 'Retour enregistre',
        description: 'Le retour a ete enregistre avec succes.',
        type: 'success',
      });
    },
    onError: () => {
      addToast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer le retour.',
        type: 'error',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => reservationService.cancelReservation(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      addToast({
        title: 'Reservation annulee',
        description: 'La reservation a ete annulee.',
        type: 'success',
      });
    },
    onError: () => {
      addToast({
        title: 'Erreur',
        description: 'Impossible d\'annuler la reservation.',
        type: 'error',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Reservation non trouvee</h2>
        <p className="text-muted-foreground mb-4">
          La reservation demandee n'existe pas ou a ete supprimee.
        </p>
        <Link to="/reservations">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux reservations
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/reservations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{reservation.referenceNumber}</h1>
            <p className="text-muted-foreground">
              Creee le {formatDateTime(reservation.createdAt)}
            </p>
          </div>
        </div>
        <Badge
          variant={statusColors[reservation.status]}
          className="text-sm px-3 py-1"
        >
          {statusLabels[reservation.status]}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-24 h-16 bg-gray-100 rounded overflow-hidden">
                  {reservation.vehicle?.photos?.[0] ? (
                    <img
                      src={reservation.vehicle.photos[0].url}
                      alt={`${reservation.vehicle.brand} ${reservation.vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <Link
                    to={`/vehicles/${reservation.vehicle?.id}`}
                    className="font-semibold hover:text-primary"
                  >
                    {reservation.vehicle?.brand} {reservation.vehicle?.model}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {reservation.vehicle?.registrationNumber}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates and destination */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Details de la reservation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Date de debut</p>
                  <p className="font-medium">{formatDateTime(reservation.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date de fin</p>
                  <p className="font-medium">{formatDateTime(reservation.endDate)}</p>
                </div>
              </div>

              {reservation.destination && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Destination
                  </p>
                  <p className="font-medium">{reservation.destination}</p>
                </div>
              )}

              {reservation.purpose && (
                <div>
                  <p className="text-sm text-muted-foreground">Motif</p>
                  <p className="font-medium">{reservation.purpose}</p>
                </div>
              )}

              {reservation.passengers && reservation.passengers > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Nombre de passagers
                  </p>
                  <p className="font-medium">{reservation.passengers}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mileage */}
          {(reservation.startMileage || reservation.endMileage) && (
            <Card>
              <CardHeader>
                <CardTitle>Kilometrage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Au depart</p>
                    <p className="font-medium">
                      {reservation.startMileage?.toLocaleString() || '-'} km
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Au retour</p>
                    <p className="font-medium">
                      {reservation.endMileage?.toLocaleString() || '-'} km
                    </p>
                  </div>
                  {reservation.startMileage && reservation.endMileage && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Distance parcourue
                      </p>
                      <p className="font-medium">
                        {(
                          reservation.endMileage - reservation.startMileage
                        ).toLocaleString()}{' '}
                        km
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {reservation.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{reservation.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Rejection reason */}
          {reservation.rejectionReason && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Motif du rejet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">{reservation.rejectionReason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* User */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Demandeur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {reservation.user?.firstName} {reservation.user?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {reservation.user?.email}
              </p>
              {reservation.user?.department && (
                <p className="text-sm text-muted-foreground mt-2">
                  {reservation.user.department.name}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Driver */}
          {reservation.driver && (
            <Card>
              <CardHeader>
                <CardTitle>Chauffeur</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {reservation.driver.firstName} {reservation.driver.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {reservation.driver.phone}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Pending actions */}
              {reservation.status === 'PENDING' && isManager && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approuver
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setRejectDialogOpen(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                </>
              )}

              {/* Approved actions */}
              {reservation.status === 'APPROVED' && isAdmin && (
                <Button
                  className="w-full"
                  onClick={() => setCheckInDialogOpen(true)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Enregistrer le depart
                </Button>
              )}

              {/* In progress actions */}
              {reservation.status === 'IN_PROGRESS' && isAdmin && (
                <Button
                  className="w-full"
                  onClick={() => setCheckOutDialogOpen(true)}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Enregistrer le retour
                </Button>
              )}

              {/* Cancel */}
              {['PENDING', 'APPROVED'].includes(reservation.status) && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                >
                  Annuler la reservation
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la reservation</DialogTitle>
            <DialogDescription>
              Veuillez indiquer le motif du rejet.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motif du rejet..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate(rejectReason)}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejet...' : 'Rejeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-in dialog */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer le depart</DialogTitle>
            <DialogDescription>
              Entrez le kilometrage actuel du vehicule.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="number"
            placeholder="Kilometrage au depart"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckInDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => checkInMutation.mutate(Number(mileage))}
              disabled={!mileage || checkInMutation.isPending}
            >
              {checkInMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-out dialog */}
      <Dialog open={checkOutDialogOpen} onOpenChange={setCheckOutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer le retour</DialogTitle>
            <DialogDescription>
              Entrez le kilometrage au retour du vehicule.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="number"
            placeholder="Kilometrage au retour"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCheckOutDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => checkOutMutation.mutate(Number(mileage))}
              disabled={!mileage || checkOutMutation.isPending}
            >
              {checkOutMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
