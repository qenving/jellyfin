# Jellyfin Anime Streaming Platform

Platform streaming anime modern berbasis Jellyfin dengan frontend custom yang menggunakan Next.js dan backend NestJS.

## 🚀 Features

- **🔐 Authentication System** - Registration & login dengan JWT + HTTP-only cookies
- **📺 Anime Streaming** - HD quality streaming via Jellyfin
- **📊 Progress Tracking** - Auto-save watch progress dan continue watching
- **⭐ Watchlist** - Personal anime watchlist untuk setiap user
- **🎨 Modern UI** - Dark anime theme dengan animasi smooth
- **📱 Responsive** - Fully responsive untuk desktop & mobile
- **🔍 Search & Filter** - Cari anime dengan filter genre, tahun, rating
- **👤 User Profiles** - Manage profile dan preferences

## 🛠️ Tech Stack

### Backend
- **NestJS** - TypeScript framework untuk Node.js
- **PostgreSQL** - Database untuk user data & watchlist
- **Prisma** - ORM untuk type-safe database access
- **Jellyfin API** - Media server integration

### Frontend
- **Next.js 14** - React framework dengan App Router
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Axios** - HTTP client

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- Jellyfin Server (sudah terinstall dan running)
- npm atau yarn

## 🚀 Quick Start

### 1. Clone Repository

```bash
cd jellyfin  # Anda sudah di dalam repo
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env dengan konfigurasi Anda
nano .env

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run start:dev
```

Backend akan running di `http://localhost:3001`

### 3. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local
nano .env.local

# Start development server
npm run dev
```

Frontend akan running di `http://localhost:3000`

### 4. Konfigurasi Jellyfin

1. Buka Jellyfin Dashboard
2. Buat library khusus untuk Anime
3. Copy Library ID dari URL (misal: `/web/index.html#!/library.html?topParentId=YOUR_LIBRARY_ID`)
4. Generate API Key di Dashboard > API Keys
5. Masukkan Library ID dan API Key ke `.env` backend

## 📖 Documentation

Dokumentasi lengkap tersedia di folder `docs/`:

- [Setup Guide](docs/SETUP.md) - Panduan lengkap setup development & production
- [API Documentation](docs/API.md) - API endpoints documentation
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment guide

## 🔧 Configuration

### Backend Environment Variables

```env
# Application
NODE_ENV=development
PORT=3001
API_PREFIX=/api

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/jellyfin_anime"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Jellyfin
JELLYFIN_URL=http://localhost:8096
JELLYFIN_API_KEY=your-jellyfin-api-key
JELLYFIN_ADMIN_USERNAME=admin
JELLYFIN_ADMIN_PASSWORD=admin-password
JELLYFIN_ANIME_LIBRARY_ID=your-anime-library-id

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=Anime Platform
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎯 Project Structure

```
jellyfin-anime-platform/
├── backend/               # NestJS Backend
│   ├── src/
│   │   ├── auth/         # Authentication module
│   │   ├── user/         # User management
│   │   ├── jellyfin/     # Jellyfin API client
│   │   ├── anime/        # Anime business logic
│   │   ├── watchlist/    # Watchlist management
│   │   └── prisma/       # Database module
│   └── prisma/           # Database schema
├── frontend/             # Next.js Frontend
│   ├── src/
│   │   ├── app/         # Pages (App Router)
│   │   ├── components/  # React components
│   │   ├── lib/         # Utilities
│   │   ├── hooks/       # Custom hooks
│   │   └── contexts/    # React contexts
├── nginx/               # Nginx configuration
└── docs/                # Documentation
```

## 📝 License

MIT License

## 🙏 Acknowledgments

- [Jellyfin](https://jellyfin.org/) - Media server
- [NestJS](https://nestjs.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
