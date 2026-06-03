# 🚀 EXECOS Pro - Deploy to Render (Quick Start)

**Time Required:** 10-15 minutes  
**Cost:** $7-12/month

---

## 1️⃣ Prerequisites (5 min)

✅ You have:
- [ ] GitHub account (with access to `antoineriley1-debug/execos-pro`)
- [ ] Supabase project set up with migrations run (see AGENT_12_13_DEPLOYMENT_GUIDE.md)
- [ ] Anthropic Claude API key (from console.anthropic.com)
- [ ] Supabase URL and keys

✅ The repo must have:
- [x] Database migrations in `src/migrations/`
- [x] API routes in `src/app/api/`
- [x] React components in `src/components/`
- [x] `package.json` with correct dependencies
- [x] `.env.local.example` with env var template

---

## 2️⃣ Create Render Account (2 min)

Go to https://render.com

1. Click **"Sign up"**
2. **"Continue with GitHub"**
3. Authorize Render to access your GitHub
4. Done! You're logged in

---

## 3️⃣ Deploy App (5 min)

In Render dashboard:

1. Click **"New +"** (top right)
2. Select **"Web Service"**
3. In "Connect a repository" section:
   - Search for: `execos-pro`
   - Select: `antoineriley1-debug/execos-pro`
   - Click **"Connect"**

4. Configure the service:
   - **Name:** `execos-pro` (or anything)
   - **Environment:** `Node`
   - **Build Command:** 
     ```
     npm install && npm run build
     ```
   - **Start Command:**
     ```
     npm start
     ```
   - **Instance Type:** `Starter` ($7/month) or `Standard` ($12/month)

5. Click **"Create Web Service"**

---

## 4️⃣ Add Environment Variables (2 min)

While deployment is running:

1. In Render dashboard, go to your service
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"** for each:

   ```
   NEXT_PUBLIC_SUPABASE_URL = https://[your-project].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [get from Supabase dashboard]
   SUPABASE_SERVICE_ROLE_KEY = [get from Supabase settings]
   ANTHROPIC_API_KEY = sk-ant-[your key]
   NODE_ENV = production
   ```

4. Click **"Save"**

   Render will auto-redeploy with new env vars

---

## 5️⃣ Wait for Deployment (3-5 min)

In the "Logs" section, you'll see:

```
npm install...
Building...
npm run build...
Build completed
Starting...
Your service is live at https://execos-pro-xxx.onrender.com
```

When you see "Your service is live", copy the URL!

---

## 6️⃣ Test It Works (2 min)

Open the live URL in your browser:

```
https://execos-pro-xxx.onrender.com/dashboard
```

You should see the EXECOS dashboard.

Test both agents:
- **Synthesis:** https://execos-pro-xxx.onrender.com/dashboard/synthesis
- **Investigations:** https://execos-pro-xxx.onrender.com/dashboard/investigations

Both should load without errors!

---

## 7️⃣ Verify Database Connection (1 min)

Test API connectivity:

```bash
# Test if API can reach Supabase
curl https://execos-pro-xxx.onrender.com/api/synthesis/timeline \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json"

# Should return: 401 (authentication error) or [] (empty array)
# NOT a database error
```

If you get database errors, check:
- [ ] Supabase URL correct
- [ ] Service role key correct
- [ ] Migrations have been run
- [ ] RLS policies enabled

---

## ✅ Deployment Complete!

Your live URL is:
```
https://execos-pro-xxx.onrender.com
```

Save this URL! Share it with your team.

---

## 🔄 Redeploy (if needed)

**After code changes:**

1. Push to GitHub
2. Render auto-deploys
3. Watch logs for "Your service is live"

**To manually redeploy:**

1. In Render dashboard, click your service
2. Click **"Manual Deploy"**
3. Select branch: `main`
4. Click **"Deploy"**

---

## 💰 Costs

- **Starter plan:** $7/month (200 hours/month included)
- **Standard plan:** $12+/month (unlimited)

For hobby/testing: Starter is fine  
For production: Use Standard

---

## 🆘 If Deployment Fails

Check the build logs in Render:

**Error: "npm install failed"**
- Check `package.json` syntax
- Run `npm install` locally to verify

**Error: "npm run build failed"**
- Run `npm run build` locally
- Check for TypeScript errors
- Check all imports are correct

**Error: "Supabase connection failed"**
- Verify env vars are set correctly
- Check Supabase URL format
- Test locally with same env vars

**Error: "Application crashed"**
- Check Render logs for specific error
- Ensure all env vars are set
- Check Supabase migration was run

---

## 📊 Monitor Your App

**Check logs:**
1. Go to Render dashboard
2. Click your service
3. Click **"Logs"** tab
4. Scroll for errors

**Monitor usage:**
1. Render dashboard shows:
   - CPU usage
   - Memory usage
   - Request count
   - Response time

**If slow:**
- Upgrade to Standard instance
- Check Supabase performance
- Optimize database queries

---

## 🔐 Important Notes

- [ ] Keep `ANTHROPIC_API_KEY` secret (don't commit to Git)
- [ ] Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- [ ] Only `NEXT_PUBLIC_*` variables are exposed to browser
- [ ] Enable backups in Supabase (weekly)
- [ ] Monitor Claude API costs (can get expensive with large syntheses)

---

## 📝 After Deployment

1. ✅ **Tell your team the live URL**
2. ✅ **Test both agents work in production**
3. ✅ **Set up weekly synthesis cron job** (optional, see AGENT_12_13_DEPLOYMENT_GUIDE.md)
4. ✅ **Monitor logs for errors** (first week)
5. ✅ **Gather user feedback**

---

## 🎉 You're Done!

Your EXECOS Pro platform is now live with:
- ✅ Agent 12: Data Synthesis + AI Dialogue
- ✅ Agent 13: Bulk Investigation + Exports
- ✅ 13/13 agents complete

**Live URL:** `https://execos-pro-xxx.onrender.com`

---

**Questions? See AGENT_12_13_DEPLOYMENT_GUIDE.md for detailed setup.**

🚀 Congrats on shipping it!

