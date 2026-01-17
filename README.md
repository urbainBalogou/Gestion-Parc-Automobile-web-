# Systeme de Gestion de Flotte Automobile - Togo Data Lab

Application web professionnelle de gestion de parc automobile pour Togo Data Lab, permettant la reservation, le suivi et la maintenance des vehicules de l'organisation.

## Fonctionnalites

### Authentification et Securite
- Authentification JWT avec tokens d'acces et de rafraichissement
- Authentification a deux facteurs (2FA) avec TOTP
- Gestion des sessions et deconnexion securisee
- Reinitialisation de mot de passe par email
- Controle d'acces base sur les roles (RBAC)

### Gestion des Roles
- **SUPER_ADMIN** : Acces complet au systeme
- **ADMIN** : Gestion des vehicules, utilisateurs et parametres
- **MANAGER** : Approbation des reservations et rapports
- **EMPLOYEE** : Creation de demandes de reservation
- **DRIVER** : Chauffeurs assignes aux reservations

### Gestion des Vehicules
- CRUD complet des vehicules
- Upload de photos multiples
- Gestion des documents (assurance, controle technique)
- QR codes uniques par vehicule
- Suivi du kilometrage
- Statuts : Disponible, Reserve, En utilisation, Maintenance, Hors service

### Systeme de Reservation
- Demande de reservation avec workflow d'approbation
- Verification de disponibilite en temps reel
- Check-in/Check-out avec enregistrement du kilometrage
- Attribution de chauffeur optionnelle
- Calendrier interactif des reservations
- Historique complet des reservations

### Maintenance
- Planification des maintenances
- Gestion des priorites (Basse, Moyenne, Haute, Urgente)
- Suivi des couts
- Historique de maintenance par vehicule

### Notifications
- Notifications en temps reel dans l'application
- Notifications par email
- Preferences de notification personnalisables

### Tableaux de Bord et Rapports
- Dashboard avec statistiques en temps reel
- Graphiques d'utilisation
- Rapport sur l'etat de la flotte
- Tendances et analytics

## Stack Technique

### Backend
- **Runtime** : Node.js 20+
- **Framework** : Express.js
- **Langage** : TypeScript
- **Base de donnees** : PostgreSQL
- **ORM** : Prisma
- **Validation** : Zod
- **Documentation API** : Swagger/OpenAPI
- **Authentification** : JWT, bcrypt
- **Email** : Nodemailer
- **Logging** : Winston

### Frontend
- **Framework** : React 18+
- **Build Tool** : Vite
- **Langage** : TypeScript
- **Styling** : Tailwind CSS
- **Composants UI** : shadcn/ui (custom implementation)
- **State Management** : Zustand
- **Data Fetching** : TanStack React Query
- **Formulaires** : React Hook Form + Zod
- **Graphiques** : Recharts
- **Icones** : Lucide React

### DevOps
- **Conteneurisation** : Docker & Docker Compose
- **Reverse Proxy** : Nginx
- **CI/CD** : Ready for GitHub Actions

## Installation

### Prerequis
- Node.js 20+
- PostgreSQL 15+
- npm ou yarn
- Docker et Docker Compose (optionnel)

### Installation Locale

1. **Cloner le repository**
```bash
git clone https://github.com/togodatalab/vehicle-reservation.git
cd vehicle-reservation
```

2. **Configuration de l'environnement**
```bash
cp .env.example .env
# Editer .env avec vos configurations
```

3. **Installation du Backend**
```bash
cd backend
npm install
cp .env.example .env
# Editer backend/.env

# Generer le client Prisma
npx prisma generate

# Executer les migrations
npx prisma migrate dev

# Charger les donnees de test
npx prisma db seed
```

4. **Installation du Frontend**
```bash
cd frontend
npm install
cp .env.example .env
# Editer frontend/.env
```

5. **Demarrer l'application**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

L'application sera accessible sur :
- Frontend : http://localhost:5173
- Backend API : http://localhost:4000
- Documentation API : http://localhost:4000/api-docs

### Installation avec Docker

```bash
# Copier et configurer l'environnement
cp .env.example .env

# Demarrer tous les services
docker-compose up -d

# Executer les migrations et le seeding
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

L'application sera accessible sur :
- Frontend : http://localhost:3000
- Backend API : http://localhost:4000
- Documentation API : http://localhost:4000/api-docs

## Donnees de Test

Apres le seeding, vous pouvez vous connecter avec :

| Role | Email | Mot de passe |
|------|-------|--------------|
| Super Admin | superadmin@togodatalab.tg | Password@123 |
| Admin | admin@togodatalab.tg | Password@123 |
| Manager | manager@togodatalab.tg | Password@123 |
| Employee | employee@togodatalab.tg | Password@123 |
| Driver | driver@togodatalab.tg | Password@123 |

## Structure du Projet

```
projet-pratique/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Schema de base de donnees
│   │   └── seed.ts            # Donnees de test
│   ├── src/
│   │   ├── config/            # Configuration (env, logger, prisma)
│   │   ├── controllers/       # Controleurs HTTP
│   │   ├── middlewares/       # Middlewares Express
│   │   ├── routes/            # Routes API
│   │   ├── services/          # Logique metier
│   │   ├── types/             # Types TypeScript
│   │   ├── utils/             # Utilitaires
│   │   ├── validators/        # Schemas de validation Zod
│   │   └── server.ts          # Point d'entree
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Composants React
│   │   │   ├── layout/        # Layouts
│   │   │   └── ui/            # Composants UI (shadcn style)
│   │   ├── lib/               # Utilitaires
│   │   ├── pages/             # Pages de l'application
│   │   ├── services/          # Services API
│   │   ├── stores/            # Stores Zustand
│   │   ├── types/             # Types TypeScript
│   │   ├── App.tsx            # Composant principal
│   │   └── main.tsx           # Point d'entree
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   └── nginx.conf             # Configuration Nginx
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Deconnexion
- `POST /api/auth/refresh` - Rafraichir le token
- `POST /api/auth/forgot-password` - Mot de passe oublie
- `POST /api/auth/reset-password` - Reinitialiser le mot de passe
- `POST /api/auth/2fa/setup` - Configurer la 2FA
- `POST /api/auth/2fa/verify` - Verifier le code 2FA
- `GET /api/auth/me` - Profil utilisateur
- `PATCH /api/auth/profile` - Mettre a jour le profil

### Vehicules
- `GET /api/vehicles` - Liste des vehicules
- `GET /api/vehicles/:id` - Detail d'un vehicule
- `POST /api/vehicles` - Creer un vehicule
- `PATCH /api/vehicles/:id` - Mettre a jour un vehicule
- `DELETE /api/vehicles/:id` - Supprimer un vehicule
- `GET /api/vehicles/:id/availability` - Verifier la disponibilite
- `POST /api/vehicles/:id/photos` - Ajouter des photos
- `POST /api/vehicles/:id/favorite` - Ajouter aux favoris

### Reservations
- `GET /api/reservations` - Liste des reservations
- `GET /api/reservations/:id` - Detail d'une reservation
- `POST /api/reservations` - Creer une reservation
- `PATCH /api/reservations/:id/approve` - Approuver
- `PATCH /api/reservations/:id/reject` - Rejeter
- `PATCH /api/reservations/:id/check-in` - Enregistrer le depart
- `PATCH /api/reservations/:id/check-out` - Enregistrer le retour
- `PATCH /api/reservations/:id/cancel` - Annuler

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `GET /api/users/:id` - Detail d'un utilisateur
- `POST /api/users` - Creer un utilisateur
- `PATCH /api/users/:id` - Mettre a jour
- `DELETE /api/users/:id` - Supprimer

### Maintenance
- `GET /api/maintenance` - Liste des maintenances
- `POST /api/maintenance` - Planifier une maintenance
- `PATCH /api/maintenance/:id` - Mettre a jour

### Notifications
- `GET /api/notifications` - Liste des notifications
- `PATCH /api/notifications/:id/read` - Marquer comme lu
- `PATCH /api/notifications/read-all` - Tout marquer comme lu

### Dashboard
- `GET /api/dashboard/stats` - Statistiques
- `GET /api/dashboard/charts` - Donnees pour graphiques

## Scripts Disponibles

### Backend
```bash
npm run dev          # Demarrer en mode developpement
npm run build        # Compiler TypeScript
npm run start        # Demarrer en production
npm run lint         # Linter
npm run test         # Executer les tests
```

### Frontend
```bash
npm run dev          # Demarrer en mode developpement
npm run build        # Build de production
npm run preview      # Previsualiser le build
npm run lint         # Linter
```

### Docker
```bash
docker-compose up -d                    # Demarrer tous les services
docker-compose down                     # Arreter tous les services
docker-compose logs -f backend          # Voir les logs du backend
docker-compose exec backend sh          # Shell dans le conteneur backend
docker-compose --profile production up  # Demarrer avec Nginx proxy
```

## Securite

- Tokens JWT avec expiration courte (15 minutes)
- Refresh tokens securises (7 jours)
- Hachage des mots de passe avec bcrypt
- Protection CSRF
- Rate limiting sur les endpoints sensibles
- Headers de securite avec Helmet
- Validation stricte des entrees avec Zod
- Authentification a deux facteurs disponible

## Deploiement en Production

1. **Configurer les variables d'environnement** avec des valeurs securisees
2. **Utiliser HTTPS** avec certificats SSL
3. **Configurer Nginx** comme reverse proxy
4. **Activer le rate limiting**
5. **Configurer les backups** de la base de donnees

```bash
# Deploiement avec Docker
docker-compose --profile production up -d
```

## Contribution

1. Fork le projet
2. Creer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de details.

## Support

Pour toute question ou probleme :
- Ouvrir une issue sur GitHub
- Contacter l'equipe : support@togodatalab.tg

---

Developpe avec par Togo Data Lab
