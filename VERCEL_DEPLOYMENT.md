# Vercel Deployment Guide - Flash BMS

## Prerequisites
- Vercel account (free at https://vercel.com/signup)
- GitHub account with repository pushed (already done ✅)

## Deployment Steps

### Option 1: Deploy React Frontend Only (Recommended for Quick Start)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New" → "Project"**
3. **Import your GitHub repository**: Select `amiclone01/Web`
4. **Configure Project**:
   - **Framework Preset**: React
   - **Root Directory**: `./client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
5. **Environment Variables** (Add these):
   - `REACT_APP_API_URL`: Your backend URL (we'll set this up next)
6. **Deploy** ✅

### Option 2: Deploy Full Stack (Frontend + Backend)

If you also want to deploy the Node.js backend on Vercel:

1. Follow steps 1-5 above, but **don't set Root Directory**
2. In **Build & Development Settings**:
   - Build Command: `cd client && npm run build`
   - Output Directory: `client/build`
3. Create `api/server.js` as a serverless function
4. Deploy ✅

### Option 3: Deploy Backend Separately (Recommended)

The backend can be deployed on:
- **Railway.app** (easiest, free tier available)
- **Render.com** (free tier)
- **Heroku** (paid)

For Railway deployment of the backend:
1. Go to https://railway.app
2. Create new project → Deploy from GitHub
3. Select the repository
4. Set start command: `cd server && npm start`
5. Add environment variables as needed

## Post-Deployment

After deployment:

1. **Update the React app** to point to your backend:
   - Edit `.env` in client folder with `REACT_APP_API_URL=your-backend-url`
   - Redeploy on Vercel

2. **Update WebSocket connection** in `src/App.js`:
   ```javascript
   const wsUrl = `wss://${window.location.host}`;
   ```

3. **Test the connection**:
   - Frontend should connect to backend via WebSocket
   - Data should flow from Python injector → Node.js server → React dashboard

## Running Locally During Development

```bash
# Terminal 1: Backend
cd server
npm install
npm start

# Terminal 2: Frontend
cd client
npm install
npm start

# Terminal 3: Data Injector
python bms_data_injector.py
```

## Troubleshooting

### WebSocket Connection Issues
- Check CORS settings in `server/server.js`
- Update WebSocket URL to match production domain
- Ensure backend API is running and accessible

### Build Failures
- Check `package.json` in both client and server
- Review Vercel build logs for specific errors
- Verify all dependencies are listed

### Data Not Showing
- Check browser console for JavaScript errors
- Verify backend API is responding: `curl https://your-backend-url/api/current-data`
- Check Python injector is running and data is being sent

## Quick Vercel Deploy Command

From project root:
```bash
npm i -g vercel
vercel deploy --prod
```

---

**Ready to deploy? Let's go!** 🚀
