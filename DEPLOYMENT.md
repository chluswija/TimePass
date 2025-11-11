# TimePass Deployment Guide

## Vercel Deployment

This guide will help you deploy TimePass to Vercel.

### Prerequisites
- Vercel account
- GitHub repository connected to Vercel
- Node.js 18.x or 20.x

### Quick Deploy

1. **Push the latest changes to GitHub:**
   ```bash
   git add .
   git commit -m "Fix Vercel deployment configuration"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository
   - Vercel will auto-detect Vite framework
   - Click "Deploy"

### Configuration Files

The following files have been configured for optimal Vercel deployment:

#### `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "NODE_VERSION": "20"
  },
  "build": {
    "env": {
      "NODE_VERSION": "20"
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### `.nvmrc`
Ensures Node.js version 20 is used.

#### `package.json` - Engines
```json
"engines": {
  "node": ">=18.0.0 <21.0.0",
  "npm": ">=9.0.0"
}
```

### Environment Variables (Optional)

If you want to use environment variables instead of hardcoded values:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add environment variables in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add the following variables:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_FIREBASE_MEASUREMENT_ID`
     - `VITE_CLOUDINARY_CLOUD_NAME`
     - `VITE_CLOUDINARY_UPLOAD_PRESET`

### Build Settings

Vercel will automatically detect these settings:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Node Version:** 20.x

### Troubleshooting

#### Issue: "libatomic.so.1: cannot open shared object file"
**Solution:** This was caused by the `node` package being in dependencies. It has been removed.

#### Issue: Build fails with npm error
**Solution:** 
- Ensure Node version is set to 18.x or 20.x
- Check `vercel.json` is present
- Verify `.nvmrc` contains `20`

#### Issue: Routes not working (404 errors)
**Solution:** The `vercel.json` rewrites configuration handles SPA routing. All routes redirect to `/index.html`.

### Firebase & Cloudinary

The app uses:
- **Firebase:** Authentication and Firestore database
- **Cloudinary:** Image and video upload storage

Both are already configured in the codebase.

### Post-Deployment Checklist

- [ ] Test user authentication
- [ ] Test post creation
- [ ] Test reel creation
- [ ] Test story creation
- [ ] Test profile pages
- [ ] Test search functionality
- [ ] Test responsive design on mobile

### Support

If you encounter any issues during deployment, check:
1. Vercel build logs
2. Browser console for errors
3. Firebase console for authentication issues
4. Cloudinary dashboard for upload issues

---

**Note:** The deployment configuration has been optimized to work with Vercel's build environment.
