# Authentication Configuration

This document outlines the Supabase authentication configuration required for MindMate AI to work correctly across all environments.

## Supabase Dashboard Settings

### Authentication → Providers
- **Email**: ✅ Enabled
- **Email confirmation**: Configure based on your needs:
  - **Disabled**: Users can sign in immediately after signup
  - **Enabled**: Users must confirm email before signing in

### Authentication → URL Configuration

#### Site URL
Add these URLs to your Site URL list:
- `http://localhost:3000` (local development)
- `https://your-app-name.vercel.app` (Vercel production)
- `https://your-app-name-git-branch.vercel.app` (Vercel preview)

#### Redirect URLs
Add these URLs to your Redirect URLs list:
- `http://localhost:3000/auth/callback` (local development)
- `https://your-app-name.vercel.app/auth/callback` (Vercel production)
- `https://your-app-name-git-branch.vercel.app/auth/callback` (Vercel preview)

### Database → Authentication → Policies

Ensure RLS (Row Level Security) is enabled on these tables:
- `profiles` table
- `entries` table  
- `sentiments` table

## Environment Variables

### Required Variables

#### Local Development (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Vercel Project Settings
Add these environment variables in Vercel Dashboard → Project Settings → Environment Variables:

**Production Environment:**
- `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-key`
- `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key`

**Preview Environment:**
- Same variables as Production

## Cookie Configuration

The application automatically configures cookies based on environment:

- **Local Development**: Uses default settings for `http://localhost:3000`
- **Production**: Sets `secure: true`, `sameSite: "lax"`, and dynamic domain

## Testing Checklist

Before deploying, verify:

- [ ] Email provider is enabled in Supabase
- [ ] Site URL includes all required domains
- [ ] Redirect URLs include all required domains  
- [ ] RLS is enabled on all tables
- [ ] Environment variables are set in Vercel
- [ ] Health check endpoint returns `ok: true`

## Health Check

Test your authentication setup:
```bash
curl https://your-app.vercel.app/api/health/auth
```

Expected response:
```json
{
  "ok": true,
  "details": {
    "supabaseUrl": "your-project.supabase.co",
    "anonKeyPresent": true,
    "serviceKeyPresent": true,
    "rls": {
      "profiles": true,
      "entries": true
    }
  },
  "remediation": ["All checks passed"]
}
```
