# Authentication Test Plan

This document provides a comprehensive test matrix for verifying authentication functionality across all environments.

## Test Scenarios

### Scenario 1: Local Sign-up and Sign-in (Machine A)
**Environment**: `http://localhost:3000`  
**Browser**: Fresh browser profile

#### Steps:
1. Start development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign Up"
4. Fill form with test data:
   - Email: `test1@example.com`
   - Password: `testpass123`
   - Display Name: `Test User 1`
5. Click "Create Account"
6. Check for success message
7. Navigate to sign-in page
8. Sign in with same credentials
9. Verify redirect to dashboard

#### Expected Results:
- ✅ Account creation succeeds
- ✅ User can sign in immediately (if email confirmation disabled)
- ✅ Dashboard loads with user data
- ✅ User menu shows correct email

#### Network Tab Checks:
- POST to `/api/auth/signup` returns 200
- POST to `/api/auth/signin` returns 200
- Cookies are set correctly

#### Application → Cookies Checks:
- `sb-access-token` present
- `sb-refresh-token` present
- Domain: `localhost`

---

### Scenario 2: Local Sign-in (Machine B)
**Environment**: `http://localhost:3000`  
**Browser**: Fresh browser profile on different machine

#### Steps:
1. Start development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign In"
4. Use credentials from Scenario 1:
   - Email: `test1@example.com`
   - Password: `testpass123`
5. Click "Sign In"
6. Verify redirect to dashboard

#### Expected Results:
- ✅ Sign-in succeeds
- ✅ Dashboard loads with user data
- ✅ User can create journal entries

#### Network Tab Checks:
- POST to `/api/auth/signin` returns 200
- No CORS errors

---

### Scenario 3: Vercel Preview Sign-up/Sign-in
**Environment**: `https://your-app-git-branch.vercel.app`

#### Steps:
1. Deploy to Vercel preview
2. Navigate to preview URL
3. Test sign-up with new email: `test2@example.com`
4. Test sign-in with same credentials
5. Verify dashboard functionality

#### Expected Results:
- ✅ Account creation succeeds
- ✅ Sign-in succeeds
- ✅ Dashboard loads correctly
- ✅ All API calls work

#### Network Tab Checks:
- All requests use HTTPS
- Cookies have `secure` flag
- No mixed content warnings

---

### Scenario 4: Vercel Production Sign-in
**Environment**: `https://your-app.vercel.app`

#### Steps:
1. Deploy to Vercel production
2. Navigate to production URL
3. Sign in with existing account
4. Test all dashboard features
5. Sign out and verify redirect

#### Expected Results:
- ✅ Sign-in succeeds
- ✅ All features work correctly
- ✅ Sign-out redirects to sign-in

## Error Scenarios

### Invalid Credentials
**Test**: Sign in with wrong password  
**Expected**: Clear error message "Invalid email or password"

### Email Not Confirmed
**Test**: Sign in with unconfirmed email (if email confirmation enabled)  
**Expected**: "Please check your email and click the confirmation link"

### Rate Limiting
**Test**: Multiple rapid sign-in attempts  
**Expected**: "Too many attempts. Please try again later"

### Network Errors
**Test**: Disconnect internet during sign-in  
**Expected**: "An unexpected error occurred. Please try again."

## Health Check Testing

### Local Health Check
```bash
curl http://localhost:3000/api/health/auth
```

### Production Health Check
```bash
curl https://your-app.vercel.app/api/health/auth
```

**Expected Response:**
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

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check `.env.local` file exists
   - Verify variable names are correct
   - Restart development server

2. **"Invalid login credentials"**
   - Verify user exists in Supabase dashboard
   - Check password is correct
   - Verify email confirmation status

3. **CORS errors**
   - Check Site URL in Supabase dashboard
   - Verify Redirect URLs include all domains

4. **Cookies not persisting**
   - Check cookie domain settings
   - Verify HTTPS in production
   - Check browser cookie settings

### Debug Commands

```bash
# Check environment variables
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"

# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" https://your-project.supabase.co/rest/v1/

# Check health endpoint
curl http://localhost:3000/api/health/auth
```

## Success Criteria

All scenarios must pass with:
- ✅ No console errors
- ✅ Proper error messages for failures
- ✅ Correct redirects
- ✅ Persistent sessions
- ✅ Health check returns `ok: true`
