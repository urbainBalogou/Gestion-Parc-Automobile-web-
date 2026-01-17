import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHasMinRole } from '@/stores/auth.store';
import { useToast } from '@/components/ui/toast';
import api from '@/services/api';

interface Department {
  id: string;
  name: string;
  code: string;
  managerId?: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
}

export function SettingsPage() {
  const isAdmin = useHasMinRole('ADMIN');
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('general');

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data;
    },
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await api.get('/locations');
      return response.data;
    },
  });

  const [generalSettings, setGeneralSettings] = useState({
    organizationName: 'Togo Data Lab',
    defaultCurrency: 'XOF',
    timezone: 'Africa/Lome',
    dateFormat: 'DD/MM/YYYY',
    reservationAutoApprove: false,
    maxReservationDays: 30,
    minAdvanceBookingHours: 2,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof generalSettings) => {
      const response = await api.put('/settings', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      addToast({
        title: 'Parametres mis a jour',
        description: 'Les parametres ont ete enregistres avec succes.',
        type: 'success',
      });
    },
    onError: () => {
      addToast({
        title: 'Erreur',
        description: 'Impossible de mettre a jour les parametres.',
        type: 'error',
      });
    },
  });

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Settings className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Acces restreint</h2>
        <p className="text-muted-foreground">
          Vous n'avez pas les permissions pour acceder a cette page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Parametres</h1>
        <p className="text-muted-foreground">
          Configurez les parametres de l'application.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Building className="h-4 w-4 mr-2" />
            Departements
          </TabsTrigger>
          <TabsTrigger value="locations">
            <MapPin className="h-4 w-4 mr-2" />
            Emplacements
          </TabsTrigger>
          <TabsTrigger value="holidays">
            <Calendar className="h-4 w-4 mr-2" />
            Jours feries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Parametres generaux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Nom de l'organisation</Label>
                  <Input
                    id="organizationName"
                    value={generalSettings.organizationName}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        organizationName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">Devise</Label>
                  <select
                    id="defaultCurrency"
                    className="w-full h-10 px-3 border rounded-md bg-background"
                    value={generalSettings.defaultCurrency}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        defaultCurrency: e.target.value,
                      })
                    }
                  >
                    <option value="XOF">XOF (Franc CFA)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="USD">USD (Dollar US)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <select
                    id="timezone"
                    className="w-full h-10 px-3 border rounded-md bg-background"
                    value={generalSettings.timezone}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        timezone: e.target.value,
                      })
                    }
                  >
                    <option value="Africa/Lome">Africa/Lome (GMT+0)</option>
                    <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Format de date</Label>
                  <select
                    id="dateFormat"
                    className="w-full h-10 px-3 border rounded-md bg-background"
                    value={generalSettings.dateFormat}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        dateFormat: e.target.value,
                      })
                    }
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parametres des reservations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Approbation automatique</p>
                  <p className="text-sm text-muted-foreground">
                    Approuver automatiquement les reservations
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={generalSettings.reservationAutoApprove}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      reservationAutoApprove: e.target.checked,
                    })
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxReservationDays">
                    Duree maximale de reservation (jours)
                  </Label>
                  <Input
                    id="maxReservationDays"
                    type="number"
                    value={generalSettings.maxReservationDays}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        maxReservationDays: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minAdvanceBookingHours">
                    Delai minimum de reservation (heures)
                  </Label>
                  <Input
                    id="minAdvanceBookingHours"
                    type="number"
                    value={generalSettings.minAdvanceBookingHours}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        minAdvanceBookingHours: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <Button
                onClick={() => updateSettingsMutation.mutate(generalSettings)}
                disabled={updateSettingsMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateSettingsMutation.isPending
                  ? 'Enregistrement...'
                  : 'Enregistrer les parametres'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="mt-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Departements</CardTitle>
              <Button>Ajouter un departement</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departments?.data?.map((dept: Department) => (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{dept.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Code: {dept.code}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                      <Button variant="outline" size="sm">
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
                {(!departments?.data || departments.data.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun departement configure
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="mt-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Emplacements</CardTitle>
              <Button>Ajouter un emplacement</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locations?.data?.map((loc: Location) => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{loc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {loc.address}, {loc.city}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                      <Button variant="outline" size="sm">
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
                {(!locations?.data || locations.data.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun emplacement configure
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays" className="mt-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Jours feries</CardTitle>
              <Button>Ajouter un jour ferie</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Jour de l\'An', date: '2025-01-01' },
                  { name: 'Fete de l\'Independance', date: '2025-04-27' },
                  { name: 'Fete du Travail', date: '2025-05-01' },
                  { name: 'Noel', date: '2025-12-25' },
                ].map((holiday, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{holiday.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(holiday.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                      <Button variant="outline" size="sm">
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
