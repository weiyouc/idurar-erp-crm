# Free Deployment Guide for IDURAR ERP/CRM

This guide covers deploying the application to free hosting services.

## Architecture Overview

- **Backend**: Node.js/Express (port 8888)
- **Frontend**: React/Vite (port 3000)
- **Database**: MongoDB
- **Node Version**: 20.9.0+

---

## Option 1: Render + Vercel/Netlify (Recommended)

### Step 1: Set Up MongoDB Atlas (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Create a database user:
   - Go to "Database Access" → "Add New Database User"
   - Username/password (save these!)
5. Whitelist IP addresses:
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for simplicity
6. Get connection string:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/idurar?retryWrites=true&w=majority`

### Step 2: Deploy Backend to Render

1. **Push code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Create Render account**: [render.com](https://render.com)

3. **Create new Web Service**:
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `idurar-backend` (or your choice)
     - **Environment**: `Node`
     - **Build Command**: `cd backend && npm install`
     - **Start Command**: `cd backend && npm start`
     - **Root Directory**: Leave empty (or set to `backend` if deploying from root)

4. **Set Environment Variables** in Render dashboard:
   ```
   DATABASE=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/idurar?retryWrites=true&w=majority
   JWT_SECRET=p6FSrVog0Tj6uqaSr/DzhJcalssRtwRLGBBTyDv+JTQ=
   PORT=10000
   NODE_ENV=production
   ```
   - Generate JWT_SECRET: Use a random string generator or `openssl rand -base64 32`

5. **Deploy**: Render will automatically deploy. Note the URL (e.g., `https://idurar-backend.onrender.com`)

6. **Run Setup Script** (one-time):
   - After first deployment, you need to run the setup script
   - In Render dashboard, go to "Shell" tab
   - Run: `cd backend && npm run setup`
   - Follow prompts to create admin account

### Step 3: Deploy Frontend to Vercel

1. **Create Vercel account**: [vercel.com](https://vercel.com)

2. **Install Vercel CLI** (optional, or use web interface):
   ```bash
   npm i -g vercel
   ```

3. **Create environment file** in `frontend/`:
   ```bash
   cd frontend
   touch .env.production
   ```
   Add to `.env.production`:
   ```
   VITE_BACKEND_SERVER=https://your-backend-url.onrender.com/
   ```

4. **Deploy via Vercel Dashboard**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Add Environment Variable:
     - `VITE_BACKEND_SERVER` = `https://your-backend-url.onrender.com/`

5. **Build Configuration** (vercel.json in frontend/):
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "devCommand": "npm run dev",
     "installCommand": "npm install"
   }
   ```

6. **Deploy**: Vercel will automatically deploy and give you a URL

---

## Option 2: Railway (All-in-One)

Railway can host both backend and frontend.

### Backend on Railway

1. Go to [railway.app](https://railway.app)
2. Create account → "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add service → Select `backend` folder
5. Set environment variables:
   ```
   DATABASE=mongodb+srv://...
   JWT_SECRET=your-secret
   PORT=10000
   NODE_ENV=production
   ```
6. Deploy and get URL

### Frontend on Railway

1. Add another service → Select `frontend` folder
2. Set build command: `npm run build`
3. Set start command: `npm run preview` (or use static file serving)
4. Set environment variable:
   ```
   VITE_BACKEND_SERVER=https://your-backend-url.railway.app/
   ```

---

## Option 3: Fly.io (Free Tier)

### Backend

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Initialize: `cd backend && fly launch`
4. Create `fly.toml`:
   ```toml
   app = "idurar-backend"
   primary_region = "iad"
   
   [build]
   
   [env]
     PORT = "8080"
     NODE_ENV = "production"
   
   [[services]]
     internal_port = 8080
     protocol = "tcp"
   
     [[services.ports]]
       handlers = ["http"]
       port = 80
   
     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
   ```
5. Set secrets: `fly secrets set DATABASE="..." JWT_SECRET="..."`
6. Deploy: `fly deploy`

### Frontend

1. Build locally: `cd frontend && npm run build`
2. Use static hosting (Vercel/Netlify) or deploy as Node app

---

## Option 4: MongoDB Atlas + Vercel + Render (Simplest)

**Backend**: Render (as above)
**Frontend**: Vercel (as above)
**Database**: MongoDB Atlas (as above)

---

## Important Configuration Notes

### Backend Environment Variables Required

```env
DATABASE=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-random-secret-key-min-32-chars
PORT=10000
NODE_ENV=production
```

### Frontend Environment Variables Required

```env
VITE_BACKEND_SERVER=https://your-backend-url.onrender.com/
```

### CORS Configuration

The backend already has CORS enabled for all origins. If you need to restrict:
- Edit `backend/src/app.js` line 22-26
- Change `origin: true` to `origin: ['https://your-frontend-domain.com']`

### File Uploads

The app uses file uploads. For production:
- Consider using AWS S3 (free tier available)
- Or use Render's persistent disk (paid)
- Or configure cloud storage in upload middleware

---

## Post-Deployment Steps

1. **Run Setup Script**:
   - Access backend shell/SSH
   - Run: `cd backend && npm run setup`
   - Create your admin account

2. **Test the Application**:
   - Visit frontend URL
   - Login with admin credentials
   - Verify all features work

3. **Monitor Logs**:
   - Render: Dashboard → Logs
   - Vercel: Dashboard → Deployments → View Function Logs

---

## Free Tier Limitations

### Render
- Free tier spins down after 15 min inactivity
- First request after spin-down takes ~30 seconds
- 750 hours/month free

### Vercel
- Unlimited static deployments
- 100GB bandwidth/month
- Serverless functions: 100GB-hours/month

### MongoDB Atlas
- 512MB storage
- Shared CPU/RAM
- Good for development/small apps

### Railway
- $5 free credit/month
- Usage-based pricing after

---

## Troubleshooting

### Backend won't start
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check logs in hosting dashboard

### Frontend can't connect to backend
- Verify `VITE_BACKEND_SERVER` is correct
- Check CORS settings
- Ensure backend URL includes protocol (`https://`)

### Database connection errors
- Verify MongoDB IP whitelist includes `0.0.0.0/0`
- Check database user credentials
- Verify connection string format

### Build failures
- Check Node version (needs 20.9.0+)
- Verify all dependencies in package.json
- Check build logs for specific errors

---

## Security Recommendations

1. **Change JWT_SECRET** to a strong random string
2. **Restrict MongoDB IP whitelist** to your hosting IPs (if possible)
3. **Use environment variables** - never commit secrets
4. **Enable HTTPS** - most free hosts do this automatically
5. **Regular backups** - MongoDB Atlas has automated backups (paid)

---

## Alternative: Self-Hosted (VPS)

If free tiers don't meet your needs:

- **DigitalOcean**: $4/month droplet
- **Linode**: $5/month
- **Hetzner**: €4/month
- **Oracle Cloud**: Always Free tier (2 VMs)

Use PM2 for process management:
```bash
npm install -g pm2
cd backend
pm2 start src/server.js --name idurar-backend
pm2 save
pm2 startup
```

---

## Quick Start Checklist

- [ ] MongoDB Atlas account and cluster created
- [ ] Database user created and IP whitelisted
- [ ] Backend deployed to Render/Railway
- [ ] Environment variables set in backend
- [ ] Setup script run (admin account created)
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variable set (backend URL)
- [ ] Application tested end-to-end
- [ ] Custom domain configured (optional)

---

## Support

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Railway Docs: https://docs.railway.app

