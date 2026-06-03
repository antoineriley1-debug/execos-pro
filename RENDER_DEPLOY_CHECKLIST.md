# Render Deployment Checklist for EXECOS Pro

## Prerequisites

1. **GitHub Repository Ready**
   - ✅ Code pushed to `https://github.com/antoineriley1-debug/execos-pro`
   - ✅ Repository is public
   - ✅ Main branch contains all production code

2. **Environment Variables Ready**
   - You need to provide:
     - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
     - `ANTHROPIC_API_KEY` - Your Anthropic API key

## Step-by-Step Deployment

### 1. Create Render Account & Link GitHub
- Go to https://render.com
- Sign up or log in
- Connect your GitHub account (antoineriley1-debug)
- Grant Render access to your repositories

### 2. Deploy EXECOS Pro Service
- Click **New +** → **Web Service**
- Select repository: `antoineriley1-debug/execos-pro`
- Use the following settings:
  - **Name:** `execos-pro`
  - **Environment:** `Node`
  - **Build Command:** `npm install && npm run build`
  - **Start Command:** `npm start`
  - **Plan:** Free (or upgrade as needed)

### 3. Configure Environment Variables
In the Render dashboard, add these **Secret** environment variables:
```
NEXT_PUBLIC_SUPABASE_URL = https://[your-supabase-url]
SUPABASE_SERVICE_ROLE_KEY = [your-service-role-key]
ANTHROPIC_API_KEY = [your-anthropic-key]
NODE_ENV = production
```

**Note:** `NEXT_PUBLIC_SUPABASE_URL` is public (NEXT_PUBLIC prefix), others are secrets.

### 4. Deploy
- Click **Deploy**
- Wait for build to complete (5-10 minutes typically)
- Monitor build logs for any errors

### 5. Verify Deployment
- Once live, your app will be at: `https://execos-pro.onrender.com` (or custom domain)
- Test login page loads
- Check that API routes respond

## Auto-Deploy on Push

Once deployed, Render will automatically:
- Watch the `main` branch
- Trigger new builds on every push
- Deploy automatically if build succeeds

## Troubleshooting

### Build Fails
- Check logs in Render dashboard
- Verify Node version matches `package.json` requirements
- Ensure all dependencies are in `package.json`

### Environment Variables Not Loading
- Confirm variables are marked as **Secret** (not Build-time)
- Check that `NEXT_PUBLIC_` prefix is used correctly
- Restart the service if you add/change variables

### Port Issues
- The app must listen on the port provided by Render
- Default is port 3000, but Render provides `PORT` env var
- `next start` should automatically respect the PORT

## Rollback

If deployment fails:
1. Go to Render dashboard
2. Click the service
3. Go to **Deploys** tab
4. Click the previous successful deploy
5. Click **Redeploy**

---

**What's Pending:**
- GitHub repo creation (if doesn't exist)
- Supabase project setup & credentials
- Anthropic API key
- Render account & deployment

**Status:** Ready for Twiney to provide the 3 environment variables and trigger deployment.
