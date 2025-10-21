# 🚀 Xpress.Delivery MVP - Deployment Guide

This guide covers secure deployment of the Xpress.Delivery MVP application with proper environment variable management.

## 🔐 Security Overview

The application has been configured to use environment variables for all sensitive data:
- ✅ API credentials are loaded from environment variables
- ✅ `.env.local` is gitignored and won't be committed
- ✅ Production configuration contains no hardcoded secrets
- ✅ Fallback configuration available for development

## 📋 Required Environment Variables

### **Essential (Required for full functionality):**
```bash
XPRESS_API_USERNAME=your-email@xpress.delivery
XPRESS_API_PASSWORD=your-password
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### **Optional (with defaults):**
```bash
XPRESS_API_BASE_URL=https://api.xpress.delivery
REVOLUT_API_KEY=your-revolut-api-key
REVOLUT_WEBHOOK_SECRET=your-webhook-secret
REVOLUT_PUBLIC_KEY=your-revolut-public-key
REVOLUT_ENVIRONMENT=sandbox
NODE_ENV=development
APP_DEBUG_MODE=true
APP_SHOW_TEST_BUTTON=true
```

## 🛠️ Deployment Options

### **Option 1: Vercel Deployment**
1. Fork the repository on GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard:
   ```
   Settings → Environment Variables
   ```
4. Deploy

### **Option 2: Netlify Deployment**
1. Connect repository to Netlify
2. Add environment variables in Netlify dashboard:
   ```
   Site Settings → Build & Deploy → Environment Variables
   ```
3. Deploy

### **Option 3: GitHub Pages (Static)**
⚠️ **Not recommended** - Can't use environment variables securely

### **Option 4: Custom Server**
1. Set environment variables on your server
2. Upload files (excluding `.env.local`)
3. Configure web server (Apache/Nginx)

## 🔧 Local Development Setup

### **Step 1: Clone Repository**
```bash
git clone https://github.com/YOUR_USERNAME/xpress-delivery-mvp.git
cd xpress-delivery-mvp/xpress-mvp
```

### **Step 2: Create Local Environment File**
```bash
cp .env.template .env.local
```

### **Step 3: Edit .env.local**
```bash
# Edit with your actual credentials
nano .env.local
```

### **Step 4: Start Development Server**
```bash
python3 -m http.server 8080
```

Access at: `http://localhost:8080/index-modular.html`

## 🌐 Production Environment Variables Setup

### **Vercel:**
```bash
vercel env add XPRESS_API_USERNAME
vercel env add XPRESS_API_PASSWORD  
vercel env add GOOGLE_MAPS_API_KEY
```

### **Netlify:**
```bash
netlify env:set XPRESS_API_USERNAME "your-email@xpress.delivery"
netlify env:set XPRESS_API_PASSWORD "your-password"
netlify env:set GOOGLE_MAPS_API_KEY "your-api-key"
```

### **Docker:**
```dockerfile
ENV XPRESS_API_USERNAME=your-email@xpress.delivery
ENV XPRESS_API_PASSWORD=your-password
ENV GOOGLE_MAPS_API_KEY=your-api-key
```

## 🔒 Security Best Practices

### **✅ DO:**
- Use environment variables for all secrets
- Restrict Google Maps API key to your domain
- Use HTTPS in production
- Keep `.env.local` gitignored
- Rotate API keys regularly
- Use different credentials for development/production

### **❌ DON'T:**
- Commit `.env.local` to git
- Share credentials in plain text
- Use development credentials in production
- Expose API keys in client-side code
- Use same API keys across multiple projects

## 📊 Environment Validation

The application automatically validates configuration on startup:

```javascript
// Check if configuration is valid
import { environment } from './src/config/api.config.production.js';

console.log('Environment:', environment.name);
console.log('Config Valid:', environment.configValid);
```

## 🚨 Troubleshooting

### **Configuration Issues:**
```bash
# Check browser console for:
⚠️ API Configuration incomplete - some features may not work properly
📋 Please check your environment variables or .env.local file
```

### **Missing Environment Variables:**
```bash
❌ Missing required environment variables!
📋 Required environment variables:
   - XPRESS_API_USERNAME
   - XPRESS_API_PASSWORD 
   - GOOGLE_MAPS_API_KEY
```

### **Development Fallback:**
If environment variables are missing, the app will:
1. Try to load from `config.local.js` (development only)
2. Fall back to mock mode with limited functionality
3. Display warnings in console

## 📈 Monitoring

In production, monitor these endpoints:
- Xpress.Delivery API health
- Google Maps API quotas
- Payment processing (Revolut)
- Application error logs

## 🔄 Updates

When updating credentials:
1. Update environment variables in your deployment platform
2. Restart/redeploy the application
3. Verify functionality in production

---

## 📞 Support

- **Application Issues:** Check browser console for configuration warnings
- **API Issues:** Verify credentials and API quotas
- **Deployment Issues:** Check platform-specific documentation

**Environment:** This application automatically detects production vs development environments and adjusts configuration accordingly.