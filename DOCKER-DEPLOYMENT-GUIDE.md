# 🐳 Docker Deployment Guide - POS System

## 📋 Prerequisites

1. **Docker Desktop** installed and running
   - Download: https://www.docker.com/products/docker-desktop
   - Windows: Ensure WSL2 backend is enabled

2. **Docker Compose** (included with Docker Desktop)

---

## 🚀 Quick Start (Windows)

### Option 1: One-Click Deployment

```bash
# Double-click this file or run:
Deploy-Docker.bat
```

### Option 2: Manual Commands

```bash
# 1. Copy environment file
copy .env.docker .env

# 2. Build and start all services
docker-compose up -d --build

# 3. Wait 30 seconds, then verify
curl http://localhost:5000/health
curl http://localhost:80
```

---

## 🚀 Quick Start (Linux/Mac)

```bash
# 1. Make script executable
chmod +x deploy-docker.sh

# 2. Run deployment
./deploy-docker.sh
```

---

## 📦 What Gets Deployed

| Service | Container Name | Port | Description |
|---------|---------------|------|-------------|
| **PostgreSQL** | `pos-postgres` | 5432 | Database server |
| **Backend API** | `pos-backend` | 5000 | Node.js API server |
| **Frontend** | `pos-frontend` | 80, 443 | Nginx web server |

---

## 🔧 Configuration

### Environment Variables (.env)

```env
# Database
DB_PASSWORD=postgres123

# JWT
JWT_SECRET=your-secret-key-here

# CORS (comma-separated)
CORS_ORIGIN=http://localhost,http://your-domain.com
```

---

## 📊 Access Points

After deployment:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health
- **Database**: localhost:5432

### Default Credentials

```
Super Admin:
  Email: factssolution@gmail.com
  Password: Black@786##

Admin:
  Email: admin@factssolution.com
  Password: Test@123
```

---

## 🛠️ Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: Deletes data!)
docker-compose down -v
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart backend only
docker-compose restart backend
```

### Rebuild

```bash
# Rebuild and restart
docker-compose up -d --build

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Database Access

```bash
# Open PostgreSQL shell
docker-compose exec postgres psql -U postgres -d pos

# List tables
\dt

# Query tenants
SELECT * FROM tenants;

# Exit
\q
```

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres pos > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres pos < backup.sql
```

---

## 🔍 Health Checks

All services have automatic health checks:

```bash
# Check container status
docker-compose ps

# Expected output:
# NAME              STATUS
# pos-postgres      Up (healthy)
# pos-backend       Up (healthy)
# pos-frontend      Up (healthy)
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using port 5000
netstat -ano | findstr :5000

# Stop conflicting service or change port in docker-compose.yml
```

### Database Not Starting

```bash
# View PostgreSQL logs
docker-compose logs postgres

# Common fix: Remove volume and restart
docker-compose down -v
docker-compose up -d
```

### Backend Not Connecting to Database

```bash
# Check environment variables
docker-compose exec backend env | grep DB_

# Expected:
# DB_HOST=postgres
# DB_PORT=5432
# DB_NAME=pos
```

### Frontend Not Loading

```bash
# Check if nginx is running
docker-compose exec frontend nginx -t

# View frontend logs
docker-compose logs frontend
```

---

## 📁 Persistent Data

Data is stored in Docker volumes:

- `postgres_data` - Database files
- `backend_uploads` - Uploaded images/files
- `backend_backups` - Database backups

### View Volumes

```bash
docker volume ls | grep pos
```

### Backup Volumes

```bash
# Backup database volume
docker run --rm -v pos_postgres_data:/data -v %cd%:/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .
```

---

## 🔄 Updates

```bash
# 1. Pull latest code
git pull

# 2. Rebuild and restart
docker-compose up -d --build

# 3. Verify
docker-compose ps
```

---

## 🎯 Production Deployment

### SSL/HTTPS

For production, add SSL certificates:

```yaml
# Add to docker-compose.yml
frontend:
  volumes:
    - ./ssl/cert.pem:/etc/nginx/ssl/cert.pem
    - ./ssl/key.pem:/etc/nginx/ssl/key.pem
```

### Environment Variables

```env
# Production .env
DB_PASSWORD=strong-password-here
JWT_SECRET=very-long-random-string
CORS_ORIGIN=https://your-domain.com
NODE_ENV=production
```

### Docker Swarm / Kubernetes

For production scaling, consider:
- Docker Compose → Docker Swarm
- Docker Compose → Kubernetes
- Add Redis for caching
- Add load balancer

---

## 📞 Support

### Check System Status

```bash
# Full system diagnostic
docker-compose ps
docker-compose logs --tail=50
docker volume ls
docker network ls
```

### Reset Everything

```bash
# WARNING: This deletes all data!
docker-compose down -v
docker system prune -af
docker-compose up -d --build
```

---

## ✅ Deployment Checklist

- [ ] Docker Desktop installed and running
- [ ] `.env` file created and configured
- [ ] Ports 80, 5000, 5432 available
- [ ] Run `Deploy-Docker.bat` or `docker-compose up -d --build`
- [ ] Wait 30-60 seconds for startup
- [ ] Verify: http://localhost:5000/health returns 200
- [ ] Verify: http://localhost loads frontend
- [ ] Test login with Super Admin credentials
- [ ] Check logs: `docker-compose logs -f`
- [ ] Create first tenant via Super Admin dashboard

---

**🎉 Your POS System is now running in Docker!**
