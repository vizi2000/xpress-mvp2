# Docker Deployment Guide - Xpress.Delivery MVP

## Overview
This guide covers building, testing, and deploying the Xpress.Delivery MVP using Docker and nginx:alpine.

## Files Created

1. **Dockerfile** - nginx:alpine based container with bash for env injection
2. **nginx.conf** - Production-ready nginx config with SPA routing, gzip, security headers, and health endpoint
3. **.dockerignore** - Excludes secrets (.env files), development files, and documentation
4. **docker-compose.yml** - Local testing with docker-compose (port 8080:80)

## Architecture

### Base Image
- **nginx:alpine** - Lightweight Alpine Linux with nginx
- **Bash** - Installed for inject-env.sh script
- **Size** - ~25MB (significantly smaller than full nginx image)

### Environment Injection
- `inject-env.sh` is copied to `/docker-entrypoint.d/40-inject-env.sh`
- nginx:alpine automatically runs scripts in `/docker-entrypoint.d/` before starting
- Placeholders in `config.local.js` are replaced with actual environment variables at runtime
- Secrets are never baked into the Docker image

### Key Features

#### nginx.conf Features:
- SPA routing with fallback to `index.html` (try_files)
- Gzip compression for text/js/css files
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Static asset caching (1 year expiry for images, fonts, etc.)
- Health check endpoint at `/health`
- Legacy version accessible at `/legacy`

#### .dockerignore Features:
- Excludes `.env.local` and `.env` (prevents secrets in image)
- Excludes development files (node_modules, .git, .vscode)
- Excludes documentation (README, specs, reports)
- Reduces image size and build time

## Local Testing

### 1. Build Docker Image
```bash
cd /Users/wojciechwiesner/ai/xpress-mvp2
docker build -t sendxpress:latest .
```

**Expected output:**
```
[+] Building 45.2s (12/12) FINISHED
 => [internal] load build definition from Dockerfile
 => => transferring dockerfile: 780B
 => [internal] load .dockerignore
 => ...
 => exporting to image
Successfully tagged sendxpress:latest
```

### 2. Test with Docker Compose
```bash
# Make sure .env.local exists with your credentials
docker-compose up
```

**Expected output:**
```
Creating sendxpress-local ... done
Attaching to sendxpress-local
sendxpress-local | 🔧 Injecting environment variables into config.local.js...
sendxpress-local | ✅ Replaced __GOOGLE_MAPS_API_KEY__
sendxpress-local | ✅ Replaced __XPRESS_API_USERNAME__
sendxpress-local | ✅ Environment variables injected successfully
sendxpress-local | 🚀 Ready to start application
sendxpress-local | /docker-entrypoint.sh: Configuration complete; ready for start up
```

**Access the app:**
- Main app: http://localhost:8080
- Legacy: http://localhost:8080/legacy
- Health: http://localhost:8080/health

### 3. Verify Health Endpoint
```bash
curl http://localhost:8080/health
```

**Expected output:**
```
healthy
```

### 4. Test Environment Injection
```bash
# Check if placeholders were replaced
docker exec sendxpress-local grep "GOOGLE_MAPS_API_KEY" /usr/share/nginx/html/config.local.js
```

Should NOT show `__GOOGLE_MAPS_API_KEY__` (should show actual key or value).

### 5. Check Logs
```bash
# View container logs
docker logs sendxpress-local

# Follow logs in real-time
docker logs -f sendxpress-local
```

### 6. Stop and Clean Up
```bash
# Stop container
docker-compose down

# Remove image (optional)
docker rmi sendxpress:latest
```

## Deployment to borg.tools

### Prerequisites
1. SSH access to borg.tools: `ssh vizi@borg.tools` (passwordless)
2. Environment variables stored on server or passed to deploy_app.py
3. `deploy_app.py` script available at `/home/vizi/deploy_app.py`

### Deployment Steps

#### 1. Upload Project Files
```bash
# From local machine
rsync -avz \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.env.local' \
  --exclude '*.log' \
  /Users/wojciechwiesner/ai/xpress-mvp2/ \
  vizi@borg.tools:/home/vizi/apps/sendxpress/
```

**Alternative using scp:**
```bash
scp -r /Users/wojciechwiesner/ai/xpress-mvp2/* vizi@borg.tools:/home/vizi/apps/sendxpress/
```

#### 2. SSH to Server
```bash
ssh vizi@borg.tools
cd /home/vizi/apps/sendxpress
```

#### 3. Run Deployment Script
```bash
python3 /home/vizi/deploy_app.py \
  --source /home/vizi/apps/sendxpress \
  --app-name sendxpress \
  --subdomain sendxpress.borg.tools \
  --container-port 80 \
  --env-var "GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_KEY" \
  --env-var "XPRESS_API_USERNAME=YOUR_USERNAME" \
  --env-var "XPRESS_API_PASSWORD=YOUR_PASSWORD" \
  --env-var "REVOLUT_API_KEY=YOUR_REVOLUT_KEY" \
  --env-var "REVOLUT_PUBLIC_KEY=YOUR_REVOLUT_PUBLIC_KEY" \
  --env-var "REVOLUT_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET" \
  --env-var "REVOLUT_ENVIRONMENT=sandbox" \
  --dockerfile-path ./Dockerfile
```

**Note:** Replace `YOUR_*` with actual values from your `.env.local` file.

**deploy_app.py will:**
1. Build Docker image from Dockerfile
2. Create nginx reverse proxy config for sendxpress.borg.tools
3. Start container with environment variables
4. Configure SSL/TLS with Let's Encrypt (automatic)
5. Reload nginx reverse proxy

### Verification Steps

#### 1. Check Container is Running
```bash
docker ps | grep sendxpress
```

**Expected output:**
```
abcd1234    sendxpress:latest    "nginx -g 'daemon of..."    Up 2 minutes    0.0.0.0:XXXX->80/tcp    sendxpress-container
```

#### 2. Check Container Logs
```bash
docker logs sendxpress-container
```

**Should show:**
```
🔧 Injecting environment variables into config.local.js...
✅ Replaced __GOOGLE_MAPS_API_KEY__
✅ Replaced __XPRESS_API_USERNAME__
✅ Environment variables injected successfully
🚀 Ready to start application
```

#### 3. Test Health Endpoint
```bash
curl http://sendxpress.borg.tools/health
```

**Expected:**
```
healthy
```

#### 4. Verify nginx Config
```bash
cat /home/vizi/nginx/conf.d/sendxpress.borg.tools.conf
```

Should show reverse proxy config created by deploy_app.py.

#### 5. Test in Browser
```bash
# Open in browser (replace with actual URL)
https://sendxpress.borg.tools
```

**Should show:**
- Xpress.Delivery MVP interface
- Google Maps loaded
- No console errors about missing API keys

#### 6. Test Legacy Version
```bash
https://sendxpress.borg.tools/legacy
```

Should load `index.html` (original non-modular version).

### Troubleshooting

#### Problem: Container not starting
```bash
# Check logs
docker logs sendxpress-container

# Check if inject-env.sh failed
docker exec sendxpress-container cat /usr/share/nginx/html/config.local.js
```

#### Problem: Placeholders not replaced
```bash
# Verify env vars were passed
docker inspect sendxpress-container | grep -A 20 "Env"

# Manually run inject-env.sh
docker exec sendxpress-container bash /docker-entrypoint.d/40-inject-env.sh
```

#### Problem: nginx not serving files
```bash
# Check nginx config syntax
docker exec sendxpress-container nginx -t

# Check file permissions
docker exec sendxpress-container ls -la /usr/share/nginx/html/
```

#### Problem: Health endpoint returns 404
```bash
# Verify nginx config loaded
docker exec sendxpress-container cat /etc/nginx/conf.d/default.conf

# Reload nginx
docker exec sendxpress-container nginx -s reload
```

### Rollback Procedure

If deployment fails:

```bash
# Stop and remove container
docker stop sendxpress-container
docker rm sendxpress-container

# Remove nginx config
rm /home/vizi/nginx/conf.d/sendxpress.borg.tools.conf

# Reload nginx reverse proxy
docker exec nginx-reverse-proxy-container nginx -s reload

# Optional: Remove image
docker rmi sendxpress:latest
```

### Re-deploy After Changes

```bash
# 1. Upload changes (from local)
rsync -avz \
  --exclude '.git' \
  /Users/wojciechwiesner/ai/xpress-mvp2/ \
  vizi@borg.tools:/home/vizi/apps/sendxpress/

# 2. SSH to server
ssh vizi@borg.tools

# 3. Stop old container
docker stop sendxpress-container
docker rm sendxpress-container

# 4. Rebuild and redeploy
cd /home/vizi/apps/sendxpress
docker build -t sendxpress:latest .

# 5. Restart with same env vars
python3 /home/vizi/deploy_app.py \
  --source /home/vizi/apps/sendxpress \
  --app-name sendxpress \
  --subdomain sendxpress.borg.tools \
  --container-port 80 \
  --env-var "GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY" \
  --env-var "XPRESS_API_USERNAME=$XPRESS_API_USERNAME" \
  --env-var "XPRESS_API_PASSWORD=$XPRESS_API_PASSWORD" \
  --env-var "REVOLUT_API_KEY=$REVOLUT_API_KEY" \
  --env-var "REVOLUT_PUBLIC_KEY=$REVOLUT_PUBLIC_KEY" \
  --env-var "REVOLUT_WEBHOOK_SECRET=$REVOLUT_WEBHOOK_SECRET" \
  --env-var "REVOLUT_ENVIRONMENT=sandbox" \
  --dockerfile-path ./Dockerfile
```

## Environment Variables Reference

### Required Variables
- `GOOGLE_MAPS_API_KEY` - Google Maps JavaScript API key
- `XPRESS_API_USERNAME` - Xpress.Delivery API username
- `XPRESS_API_PASSWORD` - Xpress.Delivery API password

### Optional Variables (Revolut Payment)
- `REVOLUT_API_KEY` - Revolut Merchant API key (defaults to mock)
- `REVOLUT_PUBLIC_KEY` - Revolut public key for widget
- `REVOLUT_WEBHOOK_SECRET` - Revolut webhook secret
- `REVOLUT_ENVIRONMENT` - `sandbox` or `prod` (default: sandbox)

**Note:** If Revolut variables are not set, the app will use mock payment mode.

## Security Considerations

1. **Secrets Never in Git**
   - `.env.local` is gitignored
   - `config.local.js` contains placeholders in git
   - Actual secrets only exist on deployment server

2. **Docker Image Security**
   - `.dockerignore` prevents secrets from being copied into image
   - Environment variables injected at runtime, not build time
   - Image can be safely shared (no secrets baked in)

3. **nginx Security**
   - Security headers enabled (X-Frame-Options, etc.)
   - HTTPS enforced by reverse proxy (handled by borg.tools nginx)
   - Static files only (no code execution in container)

4. **Access Control**
   - Only vizi@borg.tools has deployment access (passwordless SSH)
   - Container runs as non-root (nginx user)
   - Read-only volume mounts in docker-compose.yml

## Performance Optimization

1. **nginx:alpine** - Minimal image size (~25MB)
2. **Gzip compression** - Reduces bandwidth by ~70%
3. **Static asset caching** - 1 year browser cache for images/fonts
4. **CDN-ready** - Add CloudFlare in front for global performance
5. **Health check** - Kubernetes/Docker Swarm compatible

## Monitoring

### Health Check Endpoint
```bash
# Simple uptime check
curl https://sendxpress.borg.tools/health
```

**Response:** `healthy` (200 OK)

### Container Stats
```bash
# CPU/Memory usage
docker stats sendxpress-container
```

### Access Logs
```bash
# nginx access logs
docker logs sendxpress-container | grep -v "GET /health"

# Filter by IP
docker logs sendxpress-container | grep "123.456.789"
```

### Error Logs
```bash
# nginx error logs
docker logs sendxpress-container 2>&1 | grep -i error
```

## Next Steps

1. **SSL Certificate**: Automatic via Let's Encrypt (handled by deploy_app.py)
2. **Custom Domain**: Point DNS to borg.tools IP, update nginx.conf
3. **Monitoring**: Add UptimeRobot or Pingdom for uptime monitoring
4. **Backups**: Schedule database backups (if using backend in future)
5. **Analytics**: Add Google Analytics to index-modular.html
6. **CDN**: Add CloudFlare for global CDN and DDoS protection

---

## Acceptance Criteria Checklist

- [x] Dockerfile created with nginx:alpine base image
- [x] Dockerfile installs bash for inject-env.sh
- [x] Dockerfile copies all app files to /usr/share/nginx/html
- [x] Dockerfile copies nginx.conf to /etc/nginx/conf.d/
- [x] Dockerfile copies inject-env.sh to /docker-entrypoint.d/40-inject-env.sh
- [x] Dockerfile makes inject-env.sh executable
- [x] Dockerfile exposes port 80
- [x] nginx.conf has SPA routing (try_files with /index.html fallback)
- [x] nginx.conf has health check endpoint at /health
- [x] nginx.conf has gzip compression enabled
- [x] nginx.conf has security headers
- [x] nginx.conf has static asset caching (1 year)
- [x] .dockerignore excludes .env files
- [x] .dockerignore excludes development files
- [x] .dockerignore excludes documentation files
- [x] docker-compose.yml for local testing (port 8080:80)
- [x] docker-compose.yml loads env vars from .env.local
- [x] docker-compose.yml has volume mounts for hot reload
- [x] inject-env.sh has correct CONFIG_FILE path (/usr/share/nginx/html/config.local.js)
- [x] inject-env.sh is executable (chmod +x)

---

Created by The Collective Borg.tools
Date: 2025-10-20
Version: 1.0
