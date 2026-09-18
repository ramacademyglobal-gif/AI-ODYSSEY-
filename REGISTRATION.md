# Registration backend (required for /register to save teams & payment proof)

The marketing site UI for registration lives at `/register`.
Submitting registration talks to the separate Express API in:

`c:\Users\THARUN\Downloads\registration_page\ai-odyssey-24\backend`

## Local testing

1. Start the registration backend:
   ```bash
   cd "c:\Users\THARUN\Downloads\registration_page\ai-odyssey-24\backend"
   npm run dev
   ```
   Health check: http://localhost:5000/api/health

2. In the Odyssey site, set API URL (optional if using default):
   Create `.env.local`:
   ```
   NEXT_PUBLIC_REGISTRATION_API_URL=http://localhost:5000/api
   ```

3. Start Odyssey:
   ```bash
   cd "c:\Users\THARUN\Downloads\hack (2)\hack"
   npm run dev
   ```
   Open http://localhost:3000/register

4. Backend CORS: set `FRONTEND_URL=http://localhost:3000` in the backend `.env`
   so the Odyssey site can call the API.

## Production (Vercel)

1. Deploy the Express backend somewhere that stays online
   (Railway, Render, Fly.io, VPS, etc.) with Supabase + payment Drive secrets configured.
2. In the Odyssey Vercel project, set:
   `NEXT_PUBLIC_REGISTRATION_API_URL=https://YOUR-API-HOST/api`
3. On the backend, set `FRONTEND_URL` to your Odyssey production URL
   (e.g. https://ai-odyssey-jade.vercel.app).
4. Redeploy Odyssey.

Register buttons on the site already point to `/register` (same domain).
