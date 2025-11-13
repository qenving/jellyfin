# Docker Setup Guide

Quick and easy setup menggunakan Docker.

## Prerequisites

- Docker Engine >= 20.10
- Docker Compose >= 2.0

## Quick Start (Development)

### 1. Start Development Database

```bash
# Start only PostgreSQL and Redis
docker-compose -f docker-compose.dev.yml up -d

# Check if running
docker-compose -f docker-compose.dev.yml ps
```

### 2. Run Backend & Frontend Locally

```bash
# Terminal 1 - Backend
cd backend
cp .env.example .env
# Edit .env dengan konfigurasi Anda
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev

# Terminal 2 - Frontend
cd frontend
cp .env.local.example .env.local
# Edit .env.local
npm install
npm run dev
```

### 3. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Quick Start (Production dengan Docker)

### 1. Configure Environment

```bash
# Copy environment file
cp .env.docker.example .env

# Edit .env file dengan konfigurasi production Anda
nano .env
```

**Important Environment Variables:**
- `POSTGRES_PASSWORD` - Secure password untuk PostgreSQL
- `JWT_SECRET` - Secret key untuk JWT (minimal 64 karakter)
- `JELLYFIN_URL` - URL Jellyfin server
- `JELLYFIN_API_KEY` - API key dari Jellyfin
- `JELLYFIN_ANIME_LIBRARY_ID` - Library ID untuk anime

### 2. Build & Start All Services

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Run Database Migrations

```bash
# Run migrations in backend container
docker-compose exec backend npx prisma migrate deploy

# (Optional) Seed initial data
docker-compose exec backend npx prisma db seed
```

### 4. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

## Production with Nginx

### 1. Enable Nginx Service

```bash
# Start with nginx profile
docker-compose --profile production up -d
```

### 2. Configure SSL (Let's Encrypt)

```bash
# Install certbot on host
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/

# Restart nginx
docker-compose restart nginx
```

### 3. Access via Domain

- https://your-domain.com

## Useful Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Execute Commands in Container

```bash
# Backend
docker-compose exec backend npm run prisma:studio
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# Database
docker-compose exec postgres psql -U anime_user -d jellyfin_anime
```

### Stop & Remove

```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove with volumes (WARNING: deletes data)
docker-compose down -v
```

### Rebuild Specific Service

```bash
# Rebuild backend
docker-compose build backend
docker-compose up -d backend

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

## Updating Application

```bash
# Pull latest code
git pull

# Rebuild images
docker-compose build

# Restart services
docker-compose up -d

# Run migrations if needed
docker-compose exec backend npx prisma migrate deploy
```

## Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U anime_user jellyfin_anime > backup.sql

# Restore backup
cat backup.sql | docker-compose exec -T postgres psql -U anime_user -d jellyfin_anime
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - wait a few seconds and restart
docker-compose restart backend

# 2. Port already in use
sudo lsof -i :3001
sudo lsof -i :3000

# 3. Permission issues
docker-compose down
docker-compose up -d
```

### Database connection failed

```bash
# Check if postgres is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U anime_user -d jellyfin_anime -c "SELECT 1"

# Restart postgres
docker-compose restart postgres
```

### Can't connect to Jellyfin from Docker

```bash
# Use host.docker.internal instead of localhost
# In .env:
JELLYFIN_URL=http://host.docker.internal:8096

# Or use host network (Linux only)
# In docker-compose.yml, add to backend service:
network_mode: "host"
```

## Resource Limits

For production, consider adding resource limits:

```yaml
services:
  backend:
    # ... other config
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Monitoring

### Health Checks

```bash
# Check health status
docker-compose ps

# All services should show "healthy"
```

### Resource Usage

```bash
# View resource usage
docker stats

# View specific container
docker stats anime-backend
```

## Development Tips

### Hot Reload in Docker (Optional)

If you want to develop inside Docker with hot reload:

1. Create `docker-compose.override.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      target: deps-dev
    command: npm run start:dev
    volumes:
      - ./backend/src:/app/src
      - ./backend/prisma:/app/prisma

  frontend:
    build:
      target: deps
    command: npm run dev
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
```

2. Run with override:

```bash
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

---

**Docker setup is complete!** 🐳
