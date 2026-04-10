# Node.js Data Injector - Production Deployment Guide

## Problem
The Python data injector (`bms_data_injector.py`) cannot run on Vercel because:
- Vercel only supports Node.js/JavaScript
- Serverless functions have execution time limits
- Python environment is not available

## Solution
Use the Node.js version of the data injector (`server/injector.js`) which:
- Runs on any Node.js platform
- Can be deployed alongside the backend
- Auto-starts in production mode
- Supports environment variables

---

## Deployment Options

### Option 1: Auto-Start with Backend (Recommended)

The injector automatically starts when `ENABLE_INJECTOR=true` or in production mode.

**For Railway/Render deployment:**

1. Deploy backend to Railway/Render (as before)
2. Add environment variable:
   ```
   ENABLE_INJECTOR=true
   ```
3. Backend will auto-start the injector

**For Vercel Edge/Functions:**

Vercel doesn't support long-running processes. Use Railway for backend instead.

### Option 2: Deploy Node.js Backend on Railway

#### Step 1: Create Railway Account
1. Go to **https://railway.app**
2. Sign up with GitHub

#### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub"**
3. Select `AMICLONE1/Web` repository
4. Choose **"Services"** then **"Node.js"**

#### Step 3: Configure Railway
1. Set **Root Directory**: `server`
2. Set **Start Command**: `npm start`
3. Add **Environment Variables**:
   ```
   ENABLE_INJECTOR=true
   NODE_ENV=production
   ```
4. Deploy 🚀

#### Step 4: Get Backend URL
After deployment, Railway shows your backend URL:
```
https://your-project-xxxxx.railway.app
```

#### Step 5: Update Vercel Frontend
1. Go to Vercel Dashboard → Your Project
2. Click **"Settings"** → **"Environment Variables"**
3. Add:
   ```
   REACT_APP_API_URL=https://your-project-xxxxx.railway.app
   REACT_APP_WS_URL=wss://your-project-xxxxx.railway.app
   ```
4. Redeploy frontend

---

## Local Development

### Run Everything Together
```bash
# Terminal 1: Backend + Injector (auto-starts)
cd server
npm install
ENABLE_INJECTOR=true npm start

# Terminal 2: Frontend
cd client
npm install
npm start
```

### Run Injector Separately
```bash
# Terminal 1: Backend only
cd server
npm start

# Terminal 2: Injector only
cd server
npm run injector
```

### Development with Auto-Reload
```bash
# Terminal 1: Backend with Nodemon
cd server
npm run dev

# Terminal 2: Injector with Nodemon
cd server
npm run dev:injector

# Terminal 3: Frontend
cd client
npm run dev
```

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_INJECTOR` | false | Set to `true` to auto-start injector |
| `SERVER_URL` | http://localhost:5000 | Backend URL for injector to send data to |
| `INTERVAL` | 2000 | Data injection interval in milliseconds |
| `NODE_ENV` | development | Set to production for production mode |
| `PORT` | 5000 | Server port |
| `RESTART_INJECTOR` | true | Auto-restart injector if it crashes |

---

## Testing Production Deployment

After deploying to Railway + Vercel:

1. **Open Vercel frontend**: https://flash-bms.vercel.app
2. **Check browser console** (F12):
   - Should see: `✅ WebSocket connected`
   - Data should update every 2 seconds
3. **Verify backend**:
   ```bash
   curl https://your-railway-url/api/current-data
   ```
   Should return BMS data JSON

---

## Troubleshooting

### Injector Not Running
- Check Railway dashboard for error logs
- Verify `ENABLE_INJECTOR=true` is set
- Check `SERVER_URL` points to correct backend

### WebSocket Connection Fails
- Check `REACT_APP_WS_URL` in Vercel env vars
- Use `wss://` for HTTPS (production)
- Use `ws://` for HTTP (development)

### No Data Updates
- Check injector logs on Railway
- Verify backend is running: `https://backend-url/api/current-data`
- Check browser network tab for WebSocket errors

### High Memory Usage
- Reduce temperature history buffer in `injector.js`
- Reduce injection frequency (increase `INTERVAL`)
- Add restart limits to prevent runaway processes

---

## Production Checklist

- [ ] Backend deployed to Railway
- [ ] Injector auto-starts (`ENABLE_INJECTOR=true`)
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set correctly
- [ ] WebSocket URL is `wss://` (HTTPS)
- [ ] Test: Open frontend, verify live data updates
- [ ] Monitor: Check Railway logs for errors
- [ ] Backup: Keep git backup of all code

---

## Cost Estimates

- **Vercel Frontend**: Free tier (5GB storage, unlimited bandwidth)
- **Railway Backend**: ~$5-10/month (4GB RAM, auto-sleep policies)
- **Total**: Minimal cost for testing, ~$5-10/month for basic production

---

**Ready to deploy?** Follow the Railway deployment steps above! 🚀
