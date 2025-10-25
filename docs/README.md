# MindMate AI - Getting Started

## Overview
MindMate AI is a personal journaling app that uses AI to provide insights and mood tracking. Built with Next.js 14, Supabase, and OpenAI.

## Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key (optional: Hugging Face API key)

## Environment Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd mindmate_ai
   npm install
   ```

2. **Set up environment variables:**
   Copy `env.example` to `.env.local` and fill in your values:
   ```bash
   cp env.example .env.local
   ```

   Required variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   -`OPENAI_API_KEY`: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
   - `HUGGINGFACE_API_KEY`: (Optional) Your Hugging Face API key

## Supabase Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database schema:**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `docs/schema.sql`
   - Execute the SQL

3. **Configure authentication:**
   - Go to Authentication > Settings
   - Enable email authentication
   - Set site URL to `http://localhost:3000` for development

## Running Locally

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Seed demo data (optional):**
   ```bash
   npx tsx scripts/seed.ts
   ```
   This creates a demo user with sample entries.

## Deployment on Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy

3. **Update Supabase settings:**
   - Add your Vercel domain to allowed origins
   - Update site URL in Supabase auth settings

## Project Structure

```
mindmate_ai/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main app pages
│   └── api/               # API routes
├── components/            # Reusable UI components
├── lib/                   # Client-side utilities
├── server/                # Server-side utilities
├── types/                 # TypeScript type definitions
├── scripts/               # Utility scripts
└── docs/                  # Documentation
```

## Key Features

- **User Authentication**: Email/password signup and signin
- **Journal Entries**: Create and store personal journal entries
- **AI Analysis**: OpenAI-powered summarization and sentiment analysis
- **Mood Tracking**: Visual mood charts using Recharts
- **Responsive Design**: Works on desktop and mobile
- **Dark Mode**: Toggle between light and dark themes

## Troubleshooting

### Common Issues

1. **Supabase connection errors:**
   - Verify your environment variables are correct
   - Check that RLS policies are properly set up

2. **OpenAI API errors:**
   - Verify your API key is valid
   - Check your OpenAI account has sufficient credits

3. **Build errors:**
   - Run `npm run build` to check for TypeScript errors
   - Ensure all dependencies are installed

### Getting Help

- Check the console for error messages
- Review the Supabase logs in your dashboard
- Ensure all environment variables are set correctly

## Development Notes

- The app uses Supabase for authentication and database
- AI analysis happens server-side for security
- All user data is protected by Row Level Security (RLS)
- The app gracefully handles AI service failures
