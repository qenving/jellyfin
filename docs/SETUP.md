# Development Setup Guide

Panduan lengkap untuk setup development environment Jellyfin Anime Platform.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Jellyfin Server Setup](#jellyfin-server-setup)
- [Database Setup](#database-setup)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Testing](#testing)
- [Common Issues](#common-issues)

## Prerequisites

Pastikan sudah terinstall:

- **Node.js** >= 18.x ([Download](https://nodejs.org/))
- **PostgreSQL** >= 14.x ([Download](https://www.postgresql.org/download/))
- **Jellyfin Server** ([Install Guide](https://jellyfin.org/docs/general/installation/))
- **Git**
- **npm** or **yarn**

### Verify Installation

```bash
node --version  # Should be >= 18.x
npm --version
psql --version  # Should be >= 14.x
```

## Jellyfin Server Setup

### 1. Install Jellyfin

Ikuti instruksi di [Jellyfin Installation Guide](https://jellyfin.org/docs/general/installation/) sesuai OS Anda.

### 2. Initial Setup

1. Buka `http://localhost:8096` di browser
2. Ikuti wizard setup awal:
   - Pilih bahasa
   - Buat admin user
   - Setup media libraries

### 3. Create Anime Library

1. Di Jellyfin Dashboard, klik **Libraries**
2. Klik **Add Media Library**
3. Content type: pilih **Shows** (untuk anime series)
4. Display name: `Anime`
5. Folder: pilih folder dimana anime disimpan
6. **IMPORTANT:** Copy Library ID dari URL
   - URL format: `/web/index.html#!/library.html?topParentId=LIBRARY_ID_HERE`
   - Contoh: jika URL `topParentId=abc123`, maka Library ID = `abc123`

### 4. Generate API Key

1. Dashboard > **API Keys**
2. Klik **Add New Key**
3. Application name: `Anime Platform Backend`
4. Copy API Key yang di-generate

### 5. Recommended Plugins (Optional)

Install plugin untuk metadata anime yang lebih lengkap:

- **AniDB** - Anime metadata provider
- **AniList** - Alternative metadata provider
- **Shoko** - Advanced anime management

## Database Setup

### 1. Create Database

**PostgreSQL (Recommended):**

```bash
# Login as postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE jellyfin_anime_dev;

# Create user
CREATE USER dev_user WITH ENCRYPTED PASSWORD 'dev_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE jellyfin_anime_dev TO dev_user;

# Grant schema privileges (PostgreSQL 15+)
\c jellyfin_anime_dev
GRANT ALL ON SCHEMA public TO dev_user;

# Exit
\q
```

### 2. Test Connection

```bash
psql -h localhost -U dev_user -d jellyfin_anime_dev
# Enter password when prompted
# Type \q to exit
```

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env
```

Edit `.env`:

```env
# Application
NODE_ENV=development
PORT=3001
API_PREFIX=/api

# Database - update dengan credentials Anda
DATABASE_URL="postgresql://dev_user:dev_password@localhost:5432/jellyfin_anime_dev?schema=public"

# JWT - untuk development boleh simple, production harus kuat
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Jellyfin - ganti dengan konfigurasi Anda
JELLYFIN_URL=http://localhost:8096
JELLYFIN_API_KEY=your-jellyfin-api-key-here
JELLYFIN_ADMIN_USERNAME=your-admin-username
JELLYFIN_ADMIN_PASSWORD=your-admin-password
JELLYFIN_ANIME_LIBRARY_ID=your-anime-library-id-here

# CORS
FRONTEND_URL=http://localhost:3000

# Cookie
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false
```

### 4. Setup Database Schema

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

### 5. Start Backend Server

```bash
npm run start:dev
```

Backend should be running at `http://localhost:3001`

### 6. Verify Backend

Open browser or use curl:

```bash
# Health check
curl http://localhost:3001/api

# Expected response: 404 with JSON (route not found, but server is running)
```

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend  # from root
# or
cd ../frontend  # from backend directory
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy example env file
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=Anime Platform Dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start Frontend Server

```bash
npm run dev
```

Frontend should be running at `http://localhost:3000`

### 5. Verify Frontend

1. Open `http://localhost:3000` in browser
2. You should see landing page
3. Click "Register" to create account
4. After registration, you should be redirected to anime catalog

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test
```

## Development Workflow

### 1. Register First User

1. Go to `http://localhost:3000`
2. Click **Register**
3. Fill form:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `Test1234`
4. Click **Create Account**

This will:
- Create user in PostgreSQL database
- Create corresponding Jellyfin user
- Auto-login and redirect to `/anime`

### 2. Explore Features

- Browse anime catalog at `/anime`
- Click anime card to see details
- Click episode to watch
- Add anime to watchlist
- Check profile at `/profile`

### 3. Making Changes

**Hot Reload is enabled:**
- Backend: Changes akan auto-reload (nodemon)
- Frontend: Changes akan auto-reload (Next.js Fast Refresh)

## Common Issues

### Backend Issues

#### ❌ "Error: connect ECONNREFUSED ::1:5432"

**Solution:** PostgreSQL tidak running atau connection string salah

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Verify DATABASE_URL in .env
```

#### ❌ "Jellyfin API request failed"

**Solution:** Jellyfin server tidak accessible atau API key salah

```bash
# Test Jellyfin
curl http://localhost:8096/System/Info

# Verify JELLYFIN_URL and JELLYFIN_API_KEY in .env
```

#### ❌ "Port 3001 already in use"

**Solution:**

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change PORT in .env
```

### Frontend Issues

#### ❌ "Failed to fetch" or CORS errors

**Solution:** Backend tidak running atau URL salah

```bash
# Verify backend is running
curl http://localhost:3001/api

# Check NEXT_PUBLIC_API_URL in .env.local
```

#### ❌ "Port 3000 already in use"

**Solution:**

```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or run on different port
PORT=3001 npm run dev
```

### Database Issues

#### ❌ "Migration failed"

**Solution:**

```bash
# Reset database (WARNING: deletes all data)
cd backend
npm run prisma:migrate reset

# Or manually drop and recreate
psql -U postgres
DROP DATABASE jellyfin_anime_dev;
CREATE DATABASE jellyfin_anime_dev;
\q

# Then run migrations again
npm run prisma:migrate
```

#### ❌ "Permission denied for schema public"

**Solution:** PostgreSQL 15+ requires explicit schema permissions

```bash
psql -U postgres -d jellyfin_anime_dev
GRANT ALL ON SCHEMA public TO dev_user;
\q
```

## IDE Setup

### VS Code (Recommended)

**Recommended Extensions:**
- ESLint
- Prettier
- Prisma
- TypeScript
- Tailwind CSS IntelliSense

**Settings (.vscode/settings.json):**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  }
}
```

### WebStorm / IntelliJ IDEA

1. Enable TypeScript support
2. Configure Prettier as code formatter
3. Enable ESLint

## Environment Variables Reference

### Backend

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| NODE_ENV | Yes | Environment | `development` |
| PORT | Yes | Backend port | `3001` |
| DATABASE_URL | Yes | PostgreSQL connection | `postgresql://...` |
| JWT_SECRET | Yes | JWT signing key | Random string |
| JWT_EXPIRES_IN | No | JWT expiry | `7d` |
| JELLYFIN_URL | Yes | Jellyfin server URL | `http://localhost:8096` |
| JELLYFIN_API_KEY | Yes | Jellyfin API key | From dashboard |
| JELLYFIN_ADMIN_USERNAME | Yes | Admin username | `admin` |
| JELLYFIN_ADMIN_PASSWORD | Yes | Admin password | Your password |
| JELLYFIN_ANIME_LIBRARY_ID | Yes | Anime library ID | From URL |
| FRONTEND_URL | Yes | Frontend URL for CORS | `http://localhost:3000` |
| COOKIE_DOMAIN | Yes | Cookie domain | `localhost` |
| COOKIE_SECURE | Yes | HTTPS only cookies | `false` for dev |

### Frontend

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Yes | Backend API URL | `http://localhost:3001/api` |
| NEXT_PUBLIC_APP_NAME | No | App name | `Anime Platform` |
| NEXT_PUBLIC_APP_URL | Yes | Frontend URL | `http://localhost:3000` |

## Next Steps

- Read [API Documentation](API.md) untuk detail API endpoints
- Read [Deployment Guide](DEPLOYMENT.md) untuk production deployment
- Explore codebase dan mulai develop!

---

**Happy Coding! 🚀**
