# EXECOS Pro Setup Guide

## Phase 1 & 2: Foundation Build Complete ✓

This is a production-grade Next.js 14 application with:
- TypeScript support
- Tailwind CSS styling
- Supabase authentication & database
- Email Intel module with Claude AI integration
- Dashboard with sidebar navigation

---

## Installation & Local Development

### 1. Install Dependencies

```bash
cd C:\Users\antoi\.openclaw\workspace\execos-pro
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the project root (copy from `.env.local.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
CLAUDE_API_KEY=your_claude_api_key_here
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

---

## Supabase Setup Instructions

### Step 1: Create a Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Create a new project
4. Choose a name, database password, and region
5. Wait for the project to initialize

### Step 2: Get API Keys

1. Go to **Settings > API** in your Supabase project
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Execute Database Schema

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `database.sql` from the project root
4. Paste it into the query editor
5. Click **Run**

⚠️ **Important**: Make sure the schema completes without errors. Check the output for any failed tables.

### Step 4: Enable Authentication

1. Go to **Authentication > Providers** in Supabase
2. Email/Password is enabled by default
3. (Optional) Enable other providers (Google, GitHub, etc.)

### Step 5: Configure Email Templates (Optional)

1. Go to **Authentication > Email Templates**
2. Customize the confirmation email if desired

---

## Claude API Integration

### Prerequisites

1. Get an API key from https://console.anthropic.com
2. Ensure you have a Claude API account with active credits

### Configuration

1. Add your API key to `.env.local`:
   ```
   CLAUDE_API_KEY=sk-ant-...
   ```

2. The `/api/analyze-email` endpoint is pre-configured to use Claude 3.5 Sonnet
   - Model: `claude-3-5-sonnet-20241022`
   - Max tokens: 1024
   - Analyzes emails for: summary, key points, action items, sentiment, confidence

### How It Works

1. User pastes email into Email Intel module
2. Client sends email text to `/api/analyze-email`
3. Backend calls Claude API with structured prompt
4. Claude returns JSON with analysis
5. Results displayed in UI

---

## Project Structure

```
execos-pro/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home page
│   │   ├── auth/
│   │   │   └── page.tsx            # Login page
│   │   ├── api/
│   │   │   └── analyze-email/
│   │   │       └── route.ts        # Email analysis API
│   │   └── dashboard/
│   │       ├── layout.tsx          # Dashboard layout with sidebar
│   │       ├── page.tsx            # Dashboard home
│   │       ├── email-intel/
│   │       │   └── page.tsx        # Email Intel module
│   │       ├── projects/
│   │       ├── contracts/
│   │       ├── documents/
│   │       ├── vendors/
│   │       ├── contacts/
│   │       ├── notes/
│   │       └── action-items/
│   ├── components/
│   │   ├── AuthProvider.tsx        # Auth context provider
│   │   ├── LoginForm.tsx           # Login/signup form
│   │   ├── Sidebar.tsx             # Dashboard sidebar
│   │   └── EmailIntelModule.tsx    # Email analysis UI
│   └── lib/
│       └── supabase.ts             # Supabase client
├── database.sql                    # Database schema
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
└── SETUP.md                        # This file
```

---

## Database Schema Overview

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User profiles (extends auth.users) |
| `sites` | Companies/organizations |
| `projects` | Projects within sites |
| `emails` | Raw email storage |
| `email_attachments` | Email file attachments |
| `contracts` | Contract documents |
| `documents` | General documents |
| `notes` | User notes |
| `action_items` | Tasks and action items |
| `vendors` | Vendor information |
| `contacts` | Contact directory |
| `ai_summaries` | AI analysis results |
| `audit_logs` | Activity audit trail |
| `inbound_email_forwarding` | Email forwarding config |

### RLS Policies

Row Level Security (RLS) is enabled on all tables. Basic policies allow:
- Users to view their own profile
- Users to access sites they own
- Full audit trail of changes

---

## Testing Checklist (Phase 3)

- [ ] **Authentication**
  - [ ] Sign up creates new user
  - [ ] Sign in redirects to dashboard
  - [ ] Can sign out
  
- [ ] **Dashboard**
  - [ ] Dashboard loads after login
  - [ ] Sidebar navigation works
  - [ ] All module links are clickable
  
- [ ] **Email Intel Module**
  - [ ] Can paste email text
  - [ ] "Analyze Email" button works
  - [ ] Claude API returns analysis
  - [ ] Summary displays correctly
  - [ ] Key points show as list
  - [ ] Action items display
  - [ ] Sentiment and confidence show

- [ ] **Database**
  - [ ] All tables exist in Supabase
  - [ ] Indexes are created
  - [ ] RLS policies are enabled

---

## Common Issues & Troubleshooting

### "Missing Supabase environment variables"
**Solution**: Check `.env.local` has correct keys copied from Supabase settings

### "Database schema execution failed"
**Solution**: 
1. Check for SQL syntax errors in the output
2. Make sure no tables already exist (or drop them first)
3. Run each statement individually if needed

### "Claude API error: 401 Unauthorized"
**Solution**: Verify your `CLAUDE_API_KEY` is valid and has active credits

### Email analysis returns empty results
**Solution**:
1. Check browser console for errors
2. Verify Claude API is responding (check network tab)
3. Ensure email text is properly formatted

### Tailwind CSS not applying
**Solution**: 
1. Run `npm run dev` (not just `npm start`)
2. Clear `.next` folder: `rm -rf .next`
3. Restart dev server

---

## Next Steps (Phase 3+)

### Phase 3: Enhanced Features
- [ ] Email forwarding integration (parse real emails from Supabase config)
- [ ] Contract parsing & analysis
- [ ] Document OCR and extraction
- [ ] Vendor/contact management CRUD
- [ ] Action item tracking and assignment
- [ ] Real-time notifications

### Phase 4: Production Hardening
- [ ] Input validation and sanitization
- [ ] Rate limiting on API endpoints
- [ ] Error tracking (Sentry/etc)
- [ ] Performance monitoring
- [ ] Database optimization
- [ ] CDN for static assets

### Phase 5: Advanced Features
- [ ] Batch email processing
- [ ] Custom AI model fine-tuning
- [ ] Machine learning for pattern detection
- [ ] Scheduled tasks & automation
- [ ] Integration marketplace
- [ ] White-label support

---

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Go to https://vercel.com
3. Import the repository
4. Add environment variables
5. Deploy

### Deploy to Other Platforms

Works with: Netlify, Railway, Render, AWS Amplify, Docker, etc.

---

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Claude API**: https://docs.anthropic.com
- **TypeScript**: https://www.typescriptlang.org/docs

---

**Built with ❤️ using Next.js 14, Supabase, and Claude AI**
