# Routing Documentation

## Migration from Middleware to App Router

This document explains the migration from Next.js middleware to App Router patterns for authentication and routing.

## Changes Made

### 1. Middleware Removal

The `middleware.ts` file was removed as it's deprecated in Next.js 16. The middleware was handling:
- Authentication checks for protected routes
- Redirecting authenticated users away from auth pages

### 2. Server-Side Authentication

Authentication is now handled at the page level using server components:

#### Protected Routes (Dashboard)
```typescript
// app/dashboard/page.tsx
import { requireAuth } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await requireAuth() // Redirects to /sign-in if not authenticated
  return <DashboardClient user={session.user} />
}
```

#### Auth Pages (Sign-in/Sign-up)
```typescript
// app/(auth)/sign-in/page.tsx
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function SignInPage() {
  const user = await getCurrentUser()
  if (user) {
    redirect('/dashboard') // Redirect authenticated users to dashboard
  }
  return <SignInClient />
}
```

### 3. Authentication Library

The `lib/auth.ts` file provides server-side authentication utilities:

- `requireAuth()`: Ensures user is authenticated, redirects if not
- `getCurrentUser()`: Gets current user, returns null if not authenticated

### 4. Client-Side Components

Auth pages are split into:
- **Server component**: Handles authentication checks and redirects
- **Client component**: Handles form interactions and UI state

## Benefits

1. **Next.js 16 Compatibility**: Uses supported App Router patterns
2. **Better Performance**: Server-side authentication checks
3. **Type Safety**: Full TypeScript support with proper types
4. **Maintainability**: Clear separation of concerns

## Route Structure

```
app/
├── (auth)/
│   ├── sign-in/
│   │   ├── page.tsx          # Server component (auth check)
│   │   └── sign-in-client.tsx # Client component (form)
│   └── sign-up/
│       ├── page.tsx          # Server component (auth check)
│       └── sign-up-client.tsx # Client component (form)
├── dashboard/
│   ├── page.tsx              # Server component (auth required)
│   └── dashboard-client.tsx  # Client component (main app)
└── api/                      # API routes (no changes needed)
```

## Migration Notes

- All authentication logic moved from middleware to page components
- Server-side redirects using `next/navigation`
- Client components handle form state and interactions
- No changes needed to API routes or client-side authentication
