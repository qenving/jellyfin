# Deployment Guide

Panduan lengkap untuk men-deploy Jellyfin Anime Platform ke production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Nginx Configuration](#nginx-configuration)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Environment Variables](#environment-variables)
- [Monitoring & Logging](#monitoring--logging)

## Prerequisites

### Server Requirements

- Ubuntu 20.04+ atau distro Linux lain
- RAM minimal 2GB (recommended 4GB+)
- Storage minimal 20GB (tergantung ukuran library anime)
- Node.js 18.x atau lebih tinggi
- PostgreSQL 14.x atau lebih tinggi
- Nginx
- Jellyfin Server sudah terinstall

### Domain & DNS

- Domain name (misal: `anime.yourdomain.com`)
- DNS A record pointing ke server IP

## Database Setup

### 1. Install PostgreSQL

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database & User

```bash
# Login sebagai postgres user
sudo -u postgres psql

# Buat database
CREATE DATABASE jellyfin_anime;

# Buat user dengan password
CREATE USER anime_user WITH ENCRYPTED PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE jellyfin_anime TO anime_user;

# Exit psql
\q
```

## Backend Deployment

### 1. Clone & Setup

```bash
# Clone repository
cd /var/www
git clone https://github.com/yourusername/jellyfin-anime.git
cd jellyfin-anime/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 2. Configure Environment

Edit `.env`:

```env
NODE_ENV=production
PORT=3001
API_PREFIX=/api

DATABASE_URL="postgresql://anime_user:your_secure_password@localhost:5432/jellyfin_anime"

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

JELLYFIN_URL=http://localhost:8096
JELLYFIN_API_KEY=your-jellyfin-api-key
JELLYFIN_ADMIN_USERNAME=admin
JELLYFIN_ADMIN_PASSWORD=admin-password
JELLYFIN_ANIME_LIBRARY_ID=your-anime-library-id

FRONTEND_URL=https://anime.yourdomain.com

COOKIE_DOMAIN=anime.yourdomain.com
COOKIE_SECURE=true
```

**IMPORTANT:** Generate secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Run Database Migrations

```bash
npm run prisma:generate
npm run prisma:deploy
```

### 4. Build Application

```bash
npm run build
```

### 5. Setup PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start dist/main.js --name anime-backend

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions shown
```

### 6. Verify Backend is Running

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs anime-backend

# Test API
curl http://localhost:3001/api
```

## Frontend Deployment

### 1. Setup Frontend

```bash
cd /var/www/jellyfin-anime/frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local
```

### 2. Configure Environment

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://anime.yourdomain.com/api
NEXT_PUBLIC_APP_NAME=Anime Platform
NEXT_PUBLIC_APP_URL=https://anime.yourdomain.com
```

### 3. Build Application

```bash
npm run build
```

### 4. Start with PM2

```bash
pm2 start npm --name anime-frontend -- start
pm2 save
```

## Nginx Configuration

### 1. Install Nginx

```bash
sudo apt install nginx
```

### 2. Create Nginx Configuration

Create `/etc/nginx/sites-available/anime-platform`:

```nginx
# Rate limiting configuration
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

# Upstream configurations
upstream backend {
    server localhost:3001;
}

upstream frontend {
    server localhost:3000;
}

# HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name anime.yourdomain.com;

    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name anime.yourdomain.com;

    # SSL certificates (akan di-setup dengan Certbot)
    ssl_certificate /etc/letsencrypt/live/anime.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/anime.yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Client upload limit (jika diperlukan)
    client_max_body_size 100M;

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Rate limiting untuk API
        limit_req zone=api_limit burst=20 nodelay;
    }

    # Auth endpoints - stricter rate limiting
    location /api/auth {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        limit_req zone=auth_limit burst=3 nodelay;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/anime-platform /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d anime.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

Certbot akan otomatis update konfigurasi Nginx dengan SSL certificates.

## Environment Variables

### Production Checklist

✅ **Backend:**
- [ ] `NODE_ENV=production`
- [ ] JWT_SECRET yang kuat (64+ karakter random)
- [ ] Database password yang aman
- [ ] COOKIE_SECURE=true
- [ ] COOKIE_DOMAIN sesuai domain production

✅ **Frontend:**
- [ ] NEXT_PUBLIC_API_URL menggunakan HTTPS
- [ ] NEXT_PUBLIC_APP_URL sesuai domain production

## Monitoring & Logging

### PM2 Monitoring

```bash
# View all processes
pm2 list

# View logs
pm2 logs

# View specific app logs
pm2 logs anime-backend
pm2 logs anime-frontend

# Monitor CPU & Memory
pm2 monit
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Database Logs

```bash
# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

## Backup Strategy

### Database Backup

```bash
# Create backup script
cat > /usr/local/bin/backup-anime-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/jellyfin-anime"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U anime_user jellyfin_anime | gzip > $BACKUP_DIR/anime-db-$TIMESTAMP.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "anime-db-*.sql.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-anime-db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-anime-db.sh") | crontab -
```

## Security Best Practices

1. **Firewall Configuration**

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL only from localhost (default)
sudo ufw status
```

2. **Keep System Updated**

```bash
sudo apt update && sudo apt upgrade -y
```

3. **Regular Security Audits**

```bash
# Check for vulnerable npm packages
cd /var/www/jellyfin-anime/backend && npm audit
cd /var/www/jellyfin-anime/frontend && npm audit
```

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
pm2 logs anime-backend

# Common issues:
# 1. Database connection - verify DATABASE_URL
# 2. Port already in use - check with: sudo lsof -i :3001
# 3. Missing dependencies - run: npm install
```

### Frontend Won't Start

```bash
# Check logs
pm2 logs anime-frontend

# Common issues:
# 1. Build failed - check: npm run build
# 2. Environment variables - verify .env.local
```

### Can't Connect to Backend

```bash
# Test backend directly
curl http://localhost:3001/api

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check firewall
sudo ufw status
```

## Performance Optimization

### 1. Enable PM2 Cluster Mode

```bash
# For backend (if CPU > 2 cores)
pm2 delete anime-backend
pm2 start dist/main.js --name anime-backend -i max

pm2 save
```

### 2. Database Optimization

```postgresql
-- Create indexes for better performance
CREATE INDEX idx_watch_history_user ON watch_history(user_id);
CREATE INDEX idx_watchlist_user ON watchlist_items(user_id);
CREATE INDEX idx_watch_history_anime ON watch_history(anime_id);
```

### 3. Nginx Caching

Add to Nginx config:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=anime_cache:10m max_size=1g inactive=60m;

location /api/anime {
    proxy_cache anime_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$request_uri";
    # ... rest of proxy config
}
```

## Updating the Application

```bash
# Pull latest changes
cd /var/www/jellyfin-anime
git pull

# Update backend
cd backend
npm install
npm run build
npm run prisma:deploy
pm2 restart anime-backend

# Update frontend
cd ../frontend
npm install
npm run build
pm2 restart anime-frontend
```

---

**🎉 Congratulations!** Your Jellyfin Anime Platform is now deployed and running in production.
