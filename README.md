## Velocity — Typing Analytics Platform

Velocity is a Monkeytype-inspired typing trainer focused on desktop workflows, deep telemetry, and a professional minimalist aesthetic. It ships with rich customization, secure email auth, and real-time leaderboards out of the box.

### Core stack

- Next.js 14 App Router + TypeScript + Tailwind v4 + shadcn/ui
- Prisma ORM with Supabase (Postgres) and Vercel deployment target
- NextAuth email magic links powered by Resend
- Upstash Redis for rate limiting and live leaderboards
- PostHog for analytics and product telemetry

### Project structure

- `src/app` — Application routes, API handlers, and layouts
- `src/modules` — Feature-centric logic (typing engine, settings, etc.)
- `src/components` — Shared UI building blocks and providers
- `prisma/schema.prisma` — Database schema for users, sessions, and typing data

### Getting started

1. Install dependencies:

	```bash
	npm install
	```

2. Duplicate `.env.example` to `.env.local` and fill in environment values: Supabase URLs, Resend API key, NextAuth secret, Upstash Redis credentials, and PostHog keys (optional).

3. Generate the Prisma client and apply migrations once your Supabase instance is ready:

	```bash
	npx prisma migrate dev
	```

4. Start the development server:

	```bash
	npm run dev
	```

	The app runs at [http://localhost:3000](http://localhost:3000).

### Available scripts

- `npm run dev` — Start Next.js in development mode
- `npm run build` — Create a production build
- `npm run start` — Run the compiled production server
- `npm run lint` — Execute ESLint (Next.js core-web-vitals rules)

### Feature highlights

- Desktop-first typing workspace with minimal/playful themes and live accent switching
- Real-time WPM, accuracy, and consistency charts powered by a Zustand typing engine
- Secure passwordless authentication with Resend magic links
- Persistent history in Supabase with automatic user settings bootstrap
- Redis-backed leaderboards and PostHog instrumentation hooks

### Deployment notes

- Vercel + Supabase make for the smoothest production deployment (Edge-aware APIs already configured)
- Ensure environment variables are set in both Vercel and Supabase
- Upstash Redis and PostHog credentials can be swapped for self-hosted equivalents if required

### Next steps

- Expand settings UI for deeper customization (layouts, sound, cadence drills)
- Add mobile optimizations and additional typing disciplines (code, punctuation drills)
- Build admin/import tooling for curated quote packs and seasonal events
