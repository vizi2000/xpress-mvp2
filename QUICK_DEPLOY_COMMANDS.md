# Quick Deploy Commands - Xpress.Delivery MVP

## Local Testing Commands

### Build Docker Image
```bash
cd /Users/wojciechwiesner/ai/xpress-mvp2
docker build -t sendxpress:latest .
```

### Test with Docker Compose
```bash
# Make sure .env.local exists first
docker-compose up
```

### Access Locally
- Main app: http://localhost:8080
- Legacy: http://localhost:8080/legacy
- Health: http://localhost:8080/health

### Verify Health
```bash
curl http://localhost:8080/health
```

### Stop Container
```bash
docker-compose down
```

---

## Deploy to borg.tools Commands

### 1. Upload Files (from local machine)
```bash
rsync -avz \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.env.local' \
  --exclude '*.log' \
  /Users/wojciechwiesner/ai/xpress-mvp2/ \
  vizi@borg.tools:/home/vizi/apps/sendxpress/
```

### 2. SSH to Server
```bash
ssh vizi@borg.tools
cd /home/vizi/apps/sendxpress
```

### 3. Deploy with deploy_app.py
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

### 4. Verify Deployment
```bash
# Check container
docker ps | grep sendxpress

# Check logs
docker logs sendxpress-container

# Test health endpoint
curl http://sendxpress.borg.tools/health

# Open in browser
https://sendxpress.borg.tools
```

---

## Troubleshooting Commands

### View Container Logs
```bash
docker logs sendxpress-container
docker logs -f sendxpress-container  # Follow logs
```

### Check Environment Variables
```bash
docker inspect sendxpress-container | grep -A 20 "Env"
```

### Check Config File
```bash
docker exec sendxpress-container cat /usr/share/nginx/html/config.local.js
```

### Check nginx Config
```bash
docker exec sendxpress-container nginx -t
docker exec sendxpress-container cat /etc/nginx/conf.d/default.conf
```

### Restart Container
```bash
docker restart sendxpress-container
```

---

## Rollback Commands

```bash
# Stop container
docker stop sendxpress-container
docker rm sendxpress-container

# Remove nginx config
rm /home/vizi/nginx/conf.d/sendxpress.borg.tools.conf

# Reload nginx
docker exec nginx-reverse-proxy-container nginx -s reload

# Remove image
docker rmi sendxpress:latest
```

---

## Re-deploy After Changes

```bash
# 1. Upload changes (from local)
rsync -avz \
  --exclude '.git' \
  /Users/wojciechwiesner/ai/xpress-mvp2/ \
  vizi@borg.tools:/home/vizi/apps/sendxpress/

# 2. SSH to server
ssh vizi@borg.tools
cd /home/vizi/apps/sendxpress

# 3. Stop old container
docker stop sendxpress-container
docker rm sendxpress-container

# 4. Rebuild image
docker build -t sendxpress:latest .

# 5. Run deploy_app.py again (same command as initial deploy)
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

---

Created by The Collective Borg.tools
