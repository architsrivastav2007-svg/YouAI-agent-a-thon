# Vercel Deployment Guide

## Project Structure
This is a monorepo with:
- **Frontend**: Next.js app in `/frontend`
- **Backend**: Express.js API in `/backend`

## Deployment Steps

### 1. Deploy Backend (API)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
   - **Install Command**: `pnpm install`

5. **Environment Variables** (CRITICAL - Add these in Vercel dashboard):
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_specific_password
   REDIS_URL=your_redis_url
   JWT_SECRET=your_jwt_secret_key
   GROQ_API_KEY=your_groq_api_key
   OPENAI_API_KEY=your_openai_api_key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_specific_password
   NODE_ENV=production
   ```

6. Click **"Deploy"**
7. **Save the backend URL** (e.g., `https://your-backend.vercel.app`)

### 2. Deploy Frontend

1. Click **"Add New"** → **"Project"** again
2. Import the same repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
   ```
   (Add any other frontend environment variables you need)

5. Click **"Deploy"**

### 3. Update CORS Configuration

After deploying, update the backend CORS to allow your frontend domain:

In `backend/server.js`, update the CORS configuration:
```javascript
app.use(
  cors({
    origin: [
      'https://your-frontend.vercel.app',
      'http://localhost:3000', // for local development
    ],
    credentials: true,
    exposedHeaders: ['Authorization'],
  })
);
```

Redeploy the backend after this change.

## Common Issues & Solutions

### Issue 1: Build Fails with "Module not found"
**Solution**: Make sure all dependencies are in `dependencies`, not `devDependencies`

### Issue 2: Database Connection Fails
**Solution**: 
- Check MongoDB URI is correct
- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0) or add Vercel IPs
- Verify the URI format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

### Issue 3: Redis Connection Fails
**Solution**: 
- Use a cloud Redis service (Upstash, Redis Cloud, etc.)
- Ensure Redis URL format is correct
- Check firewall settings

### Issue 4: CORS Errors
**Solution**: 
- Update backend CORS to include your Vercel frontend URL
- Ensure `credentials: true` is set on both backend and frontend requests

### Issue 5: Function Timeout (10s on Free Plan)
**Solution**: 
- Optimize database queries
- Use connection pooling
- Consider upgrading Vercel plan for longer timeouts
- Move background jobs to separate services

### Issue 6: Cold Starts
**Solution**: 
- Serverless functions on Vercel go to sleep after inactivity
- Consider keeping database connection alive with connection pooling
- Use Mongoose connection options: `keepAlive: true`

## Environment Variables Checklist

Backend:
- ✅ MONGODB_URI
- ✅ PORT
- ✅ EMAIL_USER
- ✅ EMAIL_PASS
- ✅ REDIS_URL
- ✅ JWT_SECRET
- ✅ GROQ_API_KEY
- ✅ OPENAI_API_KEY
- ✅ SMTP_HOST
- ✅ SMTP_PORT
- ✅ SMTP_USER
- ✅ SMTP_PASS
- ✅ NODE_ENV=production

Frontend:
- ✅ NEXT_PUBLIC_API_URL

## Testing Deployment

1. **Test Backend**: Visit `https://your-backend.vercel.app` (should show Express error or route not found)
2. **Test Frontend**: Visit `https://your-frontend.vercel.app`
3. **Test API calls**: Check browser console for CORS errors

## Alternative: Deploy as Monorepo (Single Project)

If you prefer to deploy both in one project:

1. Create `vercel.json` in root:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ]
}
```

## Notes

- Vercel free tier has 10-second function timeout
- Background jobs (`autoSOSJob`) might not work well on serverless - consider using Vercel Cron Jobs or external service
- Keep an eye on function execution logs in Vercel dashboard
- Use Vercel CLI for local testing: `npm i -g vercel && vercel dev`
