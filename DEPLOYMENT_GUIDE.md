# VOS Deployment Guide

## Current Setup
- **Backend**: Node.js/Express API (example: Render.com)
- **Frontend**: React/Vite app (example: Vercel)

## Environment Variables

### Frontend (Vercel / local)
Set `VITE_API_BASE_URL` to your backend base URL:
```
VITE_API_BASE_URL=https://voslive-1.onrender.com
```

### Backend (Render / local)

#### Server
```
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-custom-domain.com,https://another-domain.com
```

`FRONTEND_URL` and `ALLOWED_ORIGINS` must be exact origins (scheme + host + optional port), for example `https://your-app.vercel.app`.

#### Database (SQL Server)
```
DB_SERVER=...
DB_DATABASE=...
DB_USER=...
DB_PASSWORD=...
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
```

#### Email (Forgot Password)
The backend can send a new temporary password using SMTP via Nodemailer.
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

If `EMAIL_USER` and `EMAIL_PASS` are not set, the backend runs in a development fallback mode where the temporary password is logged to the backend console instead of being emailed.

## Local Development

### Start Backend
From `backend/`:
```bash
npm install
npm run dev
```

Backend default URL: `http://localhost:5000`

### Start Frontend
From `frontend/`:
```bash
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

## Deployment (Vercel + Render)

### Deploy Frontend to Vercel
1. In Vercel Project Settings → Environment Variables, set:
   - `VITE_API_BASE_URL=https://your-render-service.onrender.com`
2. Deploy / redeploy the project.

### Deploy Backend to Render
1. In Render Service Settings → Environment Variables, set backend values:
   - `FRONTEND_URL=https://your-vercel-app.vercel.app`
   - Add any other origins to `ALLOWED_ORIGINS` (comma-separated)
   - Add database values (`DB_*`)
   - Add email values (`EMAIL_*`) to enable Forgot Password emailing
2. Deploy / redeploy the service.

## Testing

### Health Check
Test backend directly:
`https://your-render-service.onrender.com/health`

### Forgot Password
Frontend calls:
- `POST /api/users/forgot-password`

If email is configured, a temporary password is sent to the vendor’s email. Otherwise the password is logged on the backend server console (development fallback).

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` matches your deployed frontend origin exactly.
- Add additional origins to `ALLOWED_ORIGINS` (comma-separated).

### Backend Sleeping (Render Free Tier)
- Some hosts sleep services after inactivity. Wake the backend by hitting `/health` before testing the frontend.
