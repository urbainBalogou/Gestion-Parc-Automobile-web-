import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Car,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { reservationService } from '@/services/reservation.service';
import { cn } from '@/lib/utils';
import type { ReservationStatus } from '@/types';

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = [
  'Janvier',
  'Fevrier',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Aout',
  'Septembre',
  'Octobre',
  'Novembre',
  'Decembre',
];

const statusColors: Record<ReservationStatus, string> = {
  PENDING: 'bg-yellow-500',
  APPROVED: 'bg-blue-500',
  REJECTED: 'bg-red-500',
  IN_PROGRESS: 'bg-green-500',
  COMPLETED: 'bg-gray-500',
  CANCELLED: 'bg-gray-400',
};

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['reservations', 'calendar', year, month],
    queryFn: () =>
      reservationService.getReservations({
        page: 1,
        limit: 100,
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
      }),
  });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getReservationsForDate = (date: Date) => {
    if (!reservations?.data) return [];
    return reservations.data.filter((reservation) => {
      const start = new Date(reservation.startDate);
      const end = new Date(reservation.endDate);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return checkDate >= start && checkDate <= end;
    });
  };

  const firstDayOfMonth = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 bg-gray-50 dark:bg-gray-900" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayReservations = getReservationsForDate(date);
      const today = isToday(date);
      const selected = isSelected(date);

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={cn(
            'h-24 p-1 border-b border-r cursor-pointer transition-colors',
            'hover:bg-muted/50',
            today && 'bg-primary/5',
            selected && 'ring-2 ring-primary ring-inset'
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={cn(
                'text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full',
                today && 'bg-primary text-primary-foreground'
              )}
            >
              {day}
            </span>
            {dayReservations.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {dayReservations.length}
              </span>
            )}
          </div>
          <div className="space-y-0.5 overflow-hidden">
            {dayReservations.slice(0, 2).map((reservation) => (
              <Link
                key={reservation.id}
                to={`/reservations/${reservation.id}`}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'block text-xs px-1 py-0.5 rounded truncate text-white',
                  statusColors[reservation.status]
                )}
              >
                {reservation.vehicle?.brand} {reservation.vehicle?.model}
              </Link>
            ))}
            {dayReservations.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{dayReservations.length - 2} autres
              </span>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const selectedDateReservations = selectedDate
    ? getReservationsForDate(selectedDate)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendrier</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble des reservations par date.
          </p>
        </div>
        <Button asChild>
          <Link to="/reservations/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle reservation
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Calendar */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {MONTHS[month]} {year}
              </h2>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={goToToday}>
              Aujourd'hui
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="loading-spinner" />
              </div>
            ) : (
              <div className="grid grid-cols-7">{renderCalendarDays()}</div>
            )}
          </CardContent>
        </Card>

        {/* Selected date details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {selectedDate
                  ? `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]}`
                  : 'Selectionnez une date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                selectedDateReservations.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateReservations.map((reservation) => (
                      <Link
                        key={reservation.id}
                        to={`/reservations/${reservation.id}`}
                        className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              statusColors[reservation.status]
                            )}
                          />
                          <span className="text-sm font-medium">
                            {reservation.referenceNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Car className="h-4 w-4" />
                          <span>
                            {reservation.vehicle?.brand}{' '}
                            {reservation.vehicle?.model}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {reservation.user?.firstName} {reservation.user?.lastName}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Aucune reservation pour cette date
                  </p>
                )
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Cliquez sur une date pour voir les reservations
                </p>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Legende</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { status: 'PENDING', label: 'En attente' },
                { status: 'APPROVED', label: 'Approuvee' },
                { status: 'IN_PROGRESS', label: 'En cours' },
                { status: 'COMPLETED', label: 'Terminee' },
                { status: 'REJECTED', label: 'Rejetee' },
                { status: 'CANCELLED', label: 'Annulee' },
              ].map(({ status, label }) => (
                <div key={status} className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-3 h-3 rounded',
                      statusColors[status as ReservationStatus]
                    )}
                  />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
