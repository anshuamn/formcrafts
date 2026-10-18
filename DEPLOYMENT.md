# FormCrafts Deployment Guide

## Quick Start (Local Development)

```bash
# Clone and setup
git clone <your-repo>
cd formcrafts

# Install dependencies
npm install

# Start development server
npm run dev
# Server runs at http://localhost:3000
```

## Docker Deployment (Recommended)

### 1. Build and Run with Docker Compose

```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down
```

### 2. Production Deployment

```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy to production
./deploy.sh production

# Or staging
./deploy.sh staging
```

## Cloud Platform Deployment

### Railway
1. Connect GitHub repo
2. Add environment variables
3. Deploy automatically

### Render
1. Create new Web Service
2. Connect GitHub repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables

### Fly.io
```bash
flyctl launch
flyctl deploy
```

### Railway (Alternative)
```bash
railway login
railway init
railway up
```

### Heroku
```bash
heroku create your-app-name
heroku config:set NODE_ENV=production
git push heroku main
```

### DigitalOcean App Platform
1. Create App from GitHub
2. Configure build: `npm install`
3. Run command: `node server.js`

### AWS ECS / ECR
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag formcrafts:latest <account>.dkr.ecr.us-east-1.amazonaws.com/formcrafts:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/formcrafts:latest
```

### Google Cloud Run
```bash
gcloud run deploy formcrafts \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure Container Apps
```bash
az containerapp up \
  --name formcrafts \
  --resource-group myResourceGroup \
  --environment myEnvironment \
  --image <registry>/formcrafts:latest
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your values
```

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3000` |
| `SESSION_SECRET` | Session encryption key | `random-string` |
| `APP_URL` | Public URL | `https://your-domain.com` |

### Optional Variables
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SMTP_HOST` | SMTP server for emails |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `MICROSOFT_CLIENT_ID` | Microsoft OAuth |

## SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL
Place certificates in `./certs/`:
- `fullchain.pem` - Certificate chain
- `privkey.pem` - Private key

## Database Setup (Optional)

If using PostgreSQL:
```bash
# Create database
createdb formcrafts

# Run migrations (if applicable)
npm run migrate
```

## Monitoring & Health Checks

```bash
# Health check endpoint
curl http://localhost:3000/api/health

# View logs
docker compose logs -f app

# Monitor resources
docker stats
```

## Backup & Restore

```bash
# Backup data
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# Restore
tar -xzf backup-20240101.tar.gz
```

## CI/CD Pipeline

The repository includes GitHub Actions workflow (`.github/workflows/deploy.yml`):
- Runs tests on every push
- Builds Docker image
- Deploys to production on main branch
- Deploys preview on pull requests

### Required GitHub Secrets
| Secret | Description |
|--------|-------------|
| `SERVER_HOST` | Production server IP |
| `SERVER_USER` | SSH username |
| `SERVER_SSH_KEY` | Private SSH key |
| `PREVIEW_SERVER_HOST` | Preview server IP |
| `PREVIEW_SERVER_USER` | Preview SSH username |
| `PREVIEW_SERVER_SSH_KEY` | Preview SSH key |

## Troubleshooting

### Port already in use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database connection issues
```bash
# Check database connectivity
docker exec -it formcrafts-db pg_isready
```

### Permission denied
```bash
# Fix file permissions
sudo chown -R 1001:1001 data/
```

### Clear cache
```bash
# Clear npm cache
npm cache clean --force

# Clear Docker cache
docker system prune -a
```

## Support

- Check logs: `docker compose logs -f`
- Health check: `curl http://localhost:3000/api/health`
- Access container: `docker compose exec app sh`