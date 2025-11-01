# Deployment Guide

## Frontend Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" and select repository
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend URL
   - `NEXT_PUBLIC_SOCKET_URL`: Your Socket.io URL
5. Click "Deploy"

### Netlify
1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables in build settings
5. Deploy

## Backend Deployment

### Railway (Recommended)
1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub repo
3. Select Node.js environment
4. Configure environment variables
5. Railway auto-deploys on git push
6. Get public URL from deployment

### Render
1. Go to [render.com](https://render.com)
2. Create new "Web Service"
3. Connect GitHub repository
4. Configure:
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment: Node
5. Add all environment variables
6. Deploy

### Heroku
1. Install Heroku CLI
2. `heroku login`
3. `heroku create your-app-name`
4. Add database: `heroku addons:create heroku-postgresql:hobby-dev`
5. Set environment variables: `heroku config:set VAR=value`
6. Push: `git push heroku main`

## Database Setup

### Neon PostgreSQL
1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string (looks like: `postgresql://...`)
4. Paste as `DATABASE_URL` in backend .env
5. Run database initialization script:
   \`\`\`bash
   psql $DATABASE_URL -f backend/init.sql
   \`\`\`

### Local PostgreSQL
1. Install PostgreSQL
2. Create database: `createdb chatflow`
3. Run: `psql chatflow -f backend/init.sql`
4. Set `DATABASE_URL` to your local connection

## Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Get these values:
   - Cloud Name (under API Environment Variable)
   - API Key
   - API Secret
4. Add to backend `.env`:
   \`\`\`
   CLOUDINARY_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   \`\`\`

## n8n Integration (Optional)

1. Deploy n8n instance
2. Create a webhook trigger workflow
3. Copy webhook URL
4. Add to backend `.env`:
   \`\`\`
   N8N_WEBHOOK_URL=https://your-n8n/webhook/chat-events
   \`\`\`

## Environment Checklist

- [ ] Frontend NEXT_PUBLIC_API_URL set to backend URL
- [ ] Frontend NEXT_PUBLIC_SOCKET_URL set to Socket.io URL
- [ ] Backend DATABASE_URL pointing to production database
- [ ] Backend JWT_SECRET is strong (use: `openssl rand -base64 32`)
- [ ] Cloudinary credentials verified and working
- [ ] CORS configured for frontend domain
- [ ] JWT_SECRET is different from development
- [ ] All sensitive values in environment, not in code
- [ ] n8n webhook URL correct (if using)

## Monitoring

### Backend Logs
- Railway: Dashboard → Logs tab
- Render: Dashboard → Logs
- Heroku: `heroku logs --tail`

### Database Queries
- Neon: Dashboard → SQL Editor
- PostgreSQL: `psql` CLI

### Real-time Monitoring
- Socket.io connections
- Message throughput
- User activity

## SSL/HTTPS

All major platforms (Vercel, Railway, Render, Heroku) provide free SSL by default.

For custom domains:
1. Update DNS CNAME records
2. SSL auto-generates within 24 hours
3. Test with: `https://your-domain.com`

## Performance Optimization

- Enable gzip compression on backend
- Compress images via Cloudinary
- Use CDN for static assets (Vercel does this)
- Enable Redis caching for user sessions (optional)
- Optimize database queries with proper indexes

## Scaling

- Database: Upgrade PostgreSQL plan
- Backend: Increase Railway/Render resources
- Frontend: Vercel auto-scales
- Media: Cloudinary handles scaling

## Cost Estimation

- Frontend (Vercel): Free - $20/month
- Backend (Railway): Free - $20/month
- Database (Neon): Free - $120/month
- Cloudinary: Free - $100+/month
- Domain: ~$12/year
- **Total**: ~$250-300/month for production
