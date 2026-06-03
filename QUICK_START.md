# EXECOS Pro - Quick Start (5 Minutes)

## TL;DR - Get Running in 5 Steps

### 1. Install Dependencies
```bash
cd C:\Users\antoi\.openclaw\workspace\execos-pro
npm install
```
⏱️ ~2 minutes

### 2. Get Credentials
Create accounts and grab keys:
- **Supabase**: https://supabase.com → New Project → Settings > API
- **Claude**: https://console.anthropic.com → API Keys

### 3. Configure Environment
```bash
# Copy template
copy .env.local.example .env.local

# Edit .env.local with your real keys:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...
# CLAUDE_API_KEY=...
```

### 4. Set Up Database
In Supabase SQL Editor:
1. Create new query
2. Paste entire `database.sql` file
3. Click **Run**
4. Wait for completion ✓

### 5. Start Dev Server
```bash
npm run dev
```
⏱️ ~30 seconds

Visit: http://localhost:3000

---

## Test It

### Sign Up
1. Go to http://localhost:3000/auth
2. Enter email and password
3. Check email for confirmation link
4. Click link to verify
5. Sign in

### Try Email Intel
1. Go to Dashboard → Email Intel
2. Paste this sample email:
```
From: boss@company.com
To: you@company.com
Subject: Project Status

Hi,
We need the Q2 report by Friday. Key points:
- Budget tracking
- Timeline updates
- Resource allocation

Can you handle this?

Thanks
```
3. Click "Analyze Email"
4. See AI analysis in 3-5 seconds

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm install` fails | Use `npm install --no-optional` |
| Missing env keys | Copy `.env.local.example` to `.env.local` |
| Database errors | Run `database.sql` line by line in Supabase |
| Email analysis fails | Check `.env.local` has `CLAUDE_API_KEY` |
| Tailwind CSS not working | Delete `.next` folder, restart `npm run dev` |
| Port 3000 already in use | Kill process or use `npm run dev -- -p 3001` |

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `.env.local` | Credentials (create from example) |
| `database.sql` | PostgreSQL schema (run in Supabase) |
| `src/app/` | All pages and routes |
| `src/components/` | React components |
| `src/lib/supabase.ts` | Supabase client |
| `SETUP.md` | Detailed setup guide |
| `README.md` | Full documentation |

---

## File Structure at a Glance

```
execos-pro/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx (home)
│   │   ├── auth/page.tsx (login)
│   │   ├── dashboard/ (all modules here)
│   │   └── api/analyze-email/route.ts
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   ├── Sidebar.tsx
│   │   └── EmailIntelModule.tsx
│   └── lib/
│       └── supabase.ts
├── database.sql (RUN THIS IN SUPABASE)
├── package.json (npm install)
├── .env.local (CREATE FROM EXAMPLE)
└── SETUP.md (READ THIS FOR DETAILS)
```

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build          # Build for production
npm start              # Run production build
npm run lint           # Check for errors

# Database
# Run database.sql in Supabase SQL Editor

# Environment
# Edit .env.local with your credentials
```

---

## Next Steps After Getting Started

1. ✓ Get app running
2. ✓ Test authentication flow
3. ✓ Test Email Intel module
4. ✓ Paste real emails to verify Claude analysis
5. → Explore other modules (Projects, Contracts, etc)
6. → Read SETUP.md for advanced configuration
7. → Read README.md for full feature documentation

---

## Support Quick Links

- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **Claude API**: https://docs.anthropic.com
- **Tailwind CSS**: https://tailwindcss.com/docs
- **This Project Docs**: Read `SETUP.md` and `README.md`

---

**That's it! You're ready to go. 🚀**

Questions? Check SETUP.md for detailed troubleshooting.
