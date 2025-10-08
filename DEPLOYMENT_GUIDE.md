# VOS Deployment Guide

## Current Setup
- **Backend**: Deployed on Render.com at `https://voslive-1.onrender.com`
- **Frontend**: Ready for Vercel deployment

## Steps to Fix the Connection

### 1. ✅ Frontend Configuration (COMPLETED)
The frontend environment variables have been updated to connect to your Render.com backend:
```
VITE_API_BASE_URL=https://voslive-1.onrender.com
```

### 2. ✅ Backend CORS Configuration (COMPLETED)
The backend now allows requests from:
- All Vercel domains (`*.vercel.app`)
- Localhost for development
- Any specific production domains you add

### 3. ✅ Frontend Build (COMPLETED)
The frontend has been rebuilt with the correct API URL.

## Next Steps for You

### Deploy to Vercel
1. **Push your changes to GitHub**:
   ```bash
   git add .
   git commit -m "Update API URL for production deployment"
   git push origin main
   ```

2. **Redeploy on Vercel**:
   - Go to your Vercel dashboard
   - Find your VOS project
   - Click "Redeploy" or it will auto-deploy from GitHub

### Deploy Backend Changes to Render.com
1. **Push backend changes to GitHub**:
   ```bash
   git add .
   git commit -m "Update CORS for Vercel deployment"
   git push origin main
   ```

2. **Redeploy on Render.com**:
   - Go to your Render.com dashboard
   - Find your backend service
   - Click "Manual Deploy" or it will auto-deploy from GitHub

## Testing the Connection

After both deployments are complete:

1. **Visit your Vercel URL** (e.g., `https://your-app.vercel.app`)
2. **Open browser developer tools** (F12)
3. **Try to login or access any API feature**
4. **Check the Network tab** to see if API calls are successful

## Troubleshooting

### If you still see CORS errors:
1. Check the browser console for the exact error
2. Verify your Vercel domain is included in the CORS configuration
3. Make sure both frontend and backend deployments are complete

### If API calls fail:
1. Test the backend directly: `https://voslive-1.onrender.com/health`
2. Check if the backend is sleeping (Render.com free tier sleeps after inactivity)
3. Verify the API endpoints are working

### Common Issues:
- **Backend sleeping**: Render.com free tier sleeps after 15 minutes of inactivity
- **Environment variables**: Make sure Vercel has the correct environment variables
- **Build cache**: Clear Vercel build cache if needed

## Environment Variables for Vercel

Make sure these are set in your Vercel project settings:
```
VITE_API_BASE_URL=https://voslive-1.onrender.com
VITE_APP_NAME=VOS - Vendor Ordering System
VITE_APP_VERSION=1.0.0
```

## Success Indicators
- ✅ Frontend loads without errors
- ✅ Login functionality works
- ✅ API calls return data (not CORS errors)
- ✅ All pages load correctly