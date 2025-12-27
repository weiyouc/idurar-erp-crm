# Deploying Frontend with PinMe (IPFS)

PinMe is a tool that deploys static sites to IPFS (InterPlanetary File System), providing decentralized hosting.

## Prerequisites

- Backend already deployed (e.g., on Render, Railway, etc.)
- Backend URL available
- Node.js installed

## Step-by-Step Guide

### 1. Install PinMe

```bash
npm install -g pinme
```

Or using yarn:
```bash
yarn global add pinme
```

### 2. Build Your Frontend

First, ensure your frontend is built for production:

```bash
cd frontend
npm install
npm run build
```

This creates a `dist` directory with optimized production files.

### 3. Configure Environment Variables

Before building, create a `.env.production` file in the `frontend/` directory:

```env
VITE_BACKEND_SERVER=https://your-backend-url.onrender.com/
```

**Important**: Replace with your actual backend URL and include the trailing slash `/`.

### 4. Rebuild with Production Environment

```bash
npm run build
```

This ensures the build includes the correct backend URL.

### 5. Deploy to IPFS with PinMe

```bash
pinme upload ./dist
```

Or if you're in the frontend directory:
```bash
pinme upload dist
```

### 6. Access Your Site

PinMe will provide:
- An IPFS content hash (CID)
- A gateway URL (e.g., `https://ipfs.io/ipfs/Qm...` or `https://eth.limo/...`)

## Alternative: Using PinMe with ENS

If you have an ENS domain, PinMe can automatically update it:

```bash
pinme upload ./dist --ens yourdomain.eth
```

## Important Considerations

### ⚠️ Limitations of IPFS Hosting

1. **Latency**: IPFS gateways can be slower than traditional CDNs
2. **Content Availability**: Content needs to be "pinned" to stay available
3. **Backend Connection**: Your backend must be deployed separately (Render, Railway, etc.)
4. **CORS**: Ensure your backend CORS settings allow requests from IPFS gateways

### ✅ Advantages

- **Decentralized**: No single point of failure
- **Free**: No hosting costs
- **Censorship Resistant**: Content stored on distributed network
- **Immutable**: Content hash ensures integrity

## Backend CORS Configuration

Since your frontend will be served from IPFS gateways, you may need to update CORS settings in `backend/src/app.js`:

```javascript
app.use(
  cors({
    origin: [
      'https://ipfs.io',
      'https://gateway.pinata.cloud',
      'https://eth.limo',
      // Add your specific IPFS gateway URLs
      true  // Or keep this to allow all origins
    ],
    credentials: true,
  })
);
```

## Pinning Services (Optional)

To ensure your content stays available, consider using a pinning service:

- **Pinata**: https://www.pinata.cloud (free tier available)
- **Web3.Storage**: https://web3.storage (free tier)
- **NFT.Storage**: https://nft.storage (free tier)

After deploying with PinMe, you can pin the content hash (CID) to these services.

## Complete Deployment Workflow

```bash
# 1. Build frontend with production config
cd frontend
echo "VITE_BACKEND_SERVER=https://your-backend.onrender.com/" > .env.production
npm run build

# 2. Deploy to IPFS
pinme upload ./dist

# 3. (Optional) Pin to pinning service
# Copy the CID from PinMe output and pin it on Pinata or similar

# 4. Access via gateway URL
# Use the URL provided by PinMe
```

## Troubleshooting

### Frontend can't connect to backend
- Verify `VITE_BACKEND_SERVER` is set correctly in `.env.production`
- Rebuild after setting environment variable
- Check backend CORS settings allow IPFS gateways

### Content not loading
- IPFS gateways can be slow on first access
- Try different gateways: `ipfs.io`, `gateway.pinata.cloud`, `eth.limo`
- Consider using a pinning service for better availability

### Build errors
- Ensure Node.js version is 20.9.0+ (check `package.json`)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Comparison: PinMe vs Traditional Hosting

| Feature | PinMe (IPFS) | Vercel/Netlify |
|---------|--------------|----------------|
| Cost | Free | Free tier available |
| Speed | Slower (gateway dependent) | Fast (CDN) |
| Availability | Requires pinning | Always available |
| Decentralization | ✅ Yes | ❌ No |
| Setup Complexity | Medium | Easy |
| Custom Domain | Via ENS | Direct DNS |

## Recommendation

**Use PinMe if:**
- You want decentralized hosting
- You're comfortable with IPFS
- You don't mind slower initial load times
- You want censorship-resistant hosting

**Use Vercel/Netlify if:**
- You need fast, reliable hosting
- You want easy setup and deployment
- You need custom domains easily
- You prefer traditional hosting

## Resources

- PinMe GitHub: https://github.com/glitternetwork/pinme
- IPFS Documentation: https://docs.ipfs.io
- Pinata (Pinning Service): https://www.pinata.cloud

