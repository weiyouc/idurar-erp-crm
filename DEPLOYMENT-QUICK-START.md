# Quick Deployment Reference

## Fastest Path: Render + Vercel

### 1. MongoDB Atlas (5 minutes)
1. Sign up: https://www.mongodb.com/cloud/atlas/register
2. Create M0 cluster (free)
3. Create database user
4. Whitelist IP: `0.0.0.0/0`
5. Get connection string

### 2. Backend on Render (10 minutes)
1. Push code to GitHub
2. Go to https://render.com → New Web Service
3. Connect GitHub repo
4. Settings:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
5. Environment Variables:
   ```
   DATABASE=mongodb+srv://user:pass@cluster.mongodb.net/db
   JWT_SECRET=generate-random-32-char-string
   PORT=10000
   NODE_ENV=production
   ```
6. Deploy → Copy URL (e.g., `https://idurar-backend.onrender.com`)

### 3. Run Setup (2 minutes)
- In Render dashboard → Shell tab:
  ```bash
  cd backend
  npm run setup
  ```
- Create admin account when prompted

### 4. Frontend on Vercel (5 minutes)
1. Go to https://vercel.com → New Project
2. Import GitHub repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Environment Variable:
   ```
   VITE_BACKEND_SERVER=https://your-backend-url.onrender.com/
   ```
   (Important: Include trailing slash `/`)
5. Deploy

### 5. Test
- Visit Vercel URL
- Login with admin credentials
- Done! 🎉

---

## Environment Variables Cheat Sheet

### Backend (.env)
```env
DATABASE=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
JWT_SECRET=your-random-secret-minimum-32-characters
PORT=10000
NODE_ENV=production
```

### Frontend (.env.production)
```env
VITE_BACKEND_SERVER=https://your-backend-url.onrender.com/
```

---

## Generate JWT Secret
```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online
# Use: https://randomkeygen.com/
```

---

## Common Issues

### Backend spins down (Render free tier)
- First request after 15 min idle takes ~30 seconds
- Upgrade to paid plan to avoid this

### Frontend can't connect
- Check `VITE_BACKEND_SERVER` has trailing slash: `https://...onrender.com/`
- Verify backend is running (check Render logs)
- Check CORS settings

### Database connection fails
- Verify MongoDB IP whitelist includes `0.0.0.0/0`
- Check connection string has correct password
- Verify cluster is running (not paused)

---

## Alternative: All-in-One on Railway

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Add two services:
   - **Backend**: Root `backend/`, start `npm start`
   - **Frontend**: Root `frontend/`, build `npm run build`, start `npm run preview`
4. Set environment variables for each service
5. Deploy

---

## Cost Summary

| Service | Free Tier | Limitations |
|---------|-----------|-------------|
| Render | ✅ Free | Spins down after 15 min |
| Vercel | ✅ Free | 100GB bandwidth/month |
| MongoDB Atlas | ✅ Free | 512MB storage |
| Railway | $5 credit | Usage-based after |

**Total Cost: $0/month** (with limitations)

