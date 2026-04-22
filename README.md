# TrustChat MVP Backend

## Environment Setup
Copy `.env.example` to `.env.local` and add the required variables.

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LITELLM_BASE_URL=
LITELLM_API_KEY=
TRINITY_CHAT_BACKEND_URL=
```

## Running locally

```bash
npm install
npm run dev
```

## Migrations

Apply the Supabase migration found in `supabase/migrations/`.
