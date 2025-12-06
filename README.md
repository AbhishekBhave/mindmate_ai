# MindMate AI

An AI-powered journaling application built with Next.js 16, TypeScript, and Supabase. Transform your thoughts into insights with intelligent mood tracking and personal reflection tools.

## Features

- 🤖 **AI-Powered Insights**: Get gentle summaries and reflection suggestions for your journal entries
- 📊 **Mood Tracking**: Visualize your emotional journey with beautiful mood charts
- 🔒 **Personal & Private**: Your thoughts are yours alone - secure and confidential
- 🌙 **Dark Mode**: Comfortable viewing in any lighting condition
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript with strict mode
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- **Supabase account** (free tier works) - [Sign up here](https://supabase.com)
- **OpenAI API key** (required for AI features) - [Get one here](https://platform.openai.com/api-keys)

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd mindmate_ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

**⚠️ IMPORTANT: The app requires API keys to function properly.**

Edit `.env.local` with your own credentials:

**Required for full functionality:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key  
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `OPENAI_API_KEY` - Your OpenAI API key (get from https://platform.openai.com/api-keys)

**What happens without keys?**
- ✅ App will load without crashing (graceful fallbacks)
- ❌ Authentication won't work (sign-in/sign-up will fail)
- ❌ AI analysis will show demo messages only
- ❌ Database operations won't work

**Each person needs their own keys** - API keys are personal and should never be shared.

### Development Workflow

The project includes a robust development server lifecycle management system to prevent common issues:

#### Starting Development Server

```bash
npm run dev
```

This command automatically:
- Checks for running Next.js dev processes
- Removes stale lock files
- Starts the server on port 3000

#### If You Encounter Issues

**Port conflicts or lock file errors:**
```bash
npm run clean && npm run dev
```

**Manual cleanup:**
```bash
npm run clean
```

The `clean` script removes:
- `.next` (Next.js build cache)
- `.turbo` (Turbopack cache)  
- `.vercel/output` (Vercel build output)

#### Available Scripts

- `npm run dev` - Start development server with automatic cleanup
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run clean` - Clean build artifacts

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the SQL schema:
```sql
-- Copy and paste the contents of docs/schema.sql into the Supabase SQL editor
```

3. Set up Row Level Security (RLS) policies:
```sql
-- Copy and paste the contents of supabase/policies.sql into the Supabase SQL editor
-- This ensures users can only access their own data
```

4. Configure authentication settings:
   - Enable email authentication in Supabase Dashboard
   - Set up email templates (optional)
   - Configure site URL for production (localhost:3000 for development)

## Project Structure

```
mindmate_ai/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Main application
│   └── api/               # API routes
├── components/            # Reusable UI components
├── lib/                   # Utilities and configurations
│   ├── auth.ts           # Authentication helpers
│   ├── supabase/         # Supabase client configurations
│   └── validations/       # Form validation schemas
├── scripts/              # Development scripts
│   └── dev-clean.mjs     # Dev server lifecycle management
└── docs/                 # Documentation
```

## Key Improvements Made

### Development Server Resilience
- **Automatic cleanup**: Prevents "Port in use" and "Unable to acquire lock" errors
- **Process detection**: Identifies running Next.js dev processes
- **Lock file management**: Removes stale lock files automatically
- **Cross-platform support**: Works on macOS and other Unix-like systems

### TypeScript Configuration
- **Strict import handling**: Prevents duplicate identifier errors
- **Type-only imports**: Clear separation between runtime and type imports
- **Verbose module syntax**: Enforces explicit import/export patterns

### Next.js 16 Compatibility
- **Middleware migration**: Moved from deprecated middleware to App Router patterns
- **Server-side authentication**: Implemented in page components
- **Async cookies API**: Updated for Next.js 16 compatibility

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The application builds successfully with:
```bash
npm run build
```

## Security Considerations

- All authentication is handled server-side
- Row Level Security (RLS) enabled on all database tables
- Environment variables properly configured
- No sensitive data exposed to client
- Service role key never exposed to browser

### Row Level Security (RLS) Policies

The application uses explicit RLS policies to ensure data isolation:

- **Entries**: Users can only access their own entries
- **Sentiments**: Users can only view sentiments for their own entries
- **Profiles**: Users can only access their own profile

Policies are defined in `supabase/policies.sql`. Key principles:

1. Every SELECT query is filtered by `auth.uid() = user_id` on entries
2. Sentiment queries use `EXISTS` checks to verify entry ownership
3. Service role is used only for server-side operations (AI analysis)
4. Client-side queries automatically respect RLS policies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with `npm run dev` and `npm run build`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

AI can be wrong. Do not use as medical advice. This tool is for personal reflection and should not replace professional mental health support.