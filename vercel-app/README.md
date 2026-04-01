# Airtel PPO Tracker - Vercel + Supabase Deployment

## One-Click Deployment Guide

### Step 1: Set Up Supabase (5 min)

1. Go to [supabase.com](https://supabase.com) → Create free account
2. Create a new project
3. Go to **SQL Editor** → Run the SQL from `supabase-setup.sql`
4. Go to **Settings** → **API** and copy:
   - `Project URL` (SUPABASE_URL)
   - `anon public` key (SUPABASE_ANON_KEY)
   - `service_role` key (SUPABASE_SERVICE_KEY)

### Step 2: Deploy to Vercel (5 min)

1. Push this folder to GitHub
2. Go to [vercel.com](https://vercel.com) → Import repository
3. Add Environment Variables:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-random-secret-key-here
REACT_APP_BACKEND_URL=https://your-app.vercel.app
```

4. Deploy!

### Default Login
- **Email**: admin@airtel.com
- **Password**: airtel123

## Project Structure

```
vercel-app/
├── api/                    # Serverless Python functions
│   ├── _utils.py          # Shared utilities
│   ├── auth/
│   │   ├── login.py
│   │   ├── logout.py
│   │   └── me.py
│   ├── users/
│   │   ├── index.py
│   │   └── [user_id].py
│   └── weeks/
│       ├── index.py
│       ├── [week_id].py
│       └── [week_id]/
│           └── tasks/...
├── src/                    # React frontend
├── public/
├── package.json
├── vercel.json
└── supabase-setup.sql     # Database setup
```

## Features
- ✅ 8-week task tracker
- ✅ Drag & drop reordering
- ✅ Calendar view
- ✅ Export PDF/Excel
- ✅ User management
- ✅ Comments on tasks
- ✅ First-login password change

## Tech Stack
- **Frontend**: React + Tailwind + Shadcn
- **Backend**: Vercel Serverless Python
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT tokens
