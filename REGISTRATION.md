# Registration backend (required for /register + /checkin)

The Express API lives in this repo at [`backend/`](./backend).
It uses **Supabase** for database + payment screenshot storage.

Supabase alone is not enough — this API must also be running.

## Local testing

1. Copy env file and fill real values (from your existing backend `.env`):
   ```bash
   cd backend
   copy .env.example .env
   ```

2. Start API:
   ```bash
   npm install
   npm run dev
   ```
   Health: http://localhost:5000/api/health

3. In Odyssey site root, create `.env.local`:
   ```
   NEXT_PUBLIC_REGISTRATION_API_URL=http://localhost:5000/api
   ```

4. In `backend/.env` set:
   ```
   FRONTEND_URL=http://localhost:3000
   ```

5. Start site:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000/register

## Host API on Render (recommended next step)

1. Push is already in this GitHub repo under `/backend`.
2. Render → **New → Web Service** → connect `AI-ODYSSEY-` repo.
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Environment variables (copy from your local `backend/.env`, never commit them):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FRONTEND_URL` = `https://ai-odyssey-jade.vercel.app` (or your site URL)
   - `JWT_SECRET`
   - `ADMIN_EMAIL` / `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` (if used)
   - `PAYMENT_STORAGE_BUCKET` = `payment-proofs`
   - `JWT_EXPIRES_IN` = `8h`
   - `GATE_CHECKIN_CODE` = organizer passcode for public QR gate check-in
     (e.g. `RAAMTECH`)
5. After deploy, copy the Render URL, e.g. `https://YOUR-SERVICE.onrender.com`
6. In **Vercel** project env, set:
   ```
   NEXT_PUBLIC_REGISTRATION_API_URL=https://YOUR-SERVICE.onrender.com/api
   ```
   Then redeploy the website.

## SQL (Supabase)

Schema + migrations are under [`backend/database/`](./backend/database).
Run them in the Supabase SQL editor if your project is not already set up.

## Organizer admin (same Odyssey site)

Not linked in the public navbar. Open directly:

- Login: `/admin/login` (e.g. https://ai-odyssey-jade.vercel.app/admin/login)
- Dashboard: `/admin`
- Participants: `/admin/participants`
- Check-in: `/admin/checkin`

Uses `NEXT_PUBLIC_REGISTRATION_API_URL` and Render `ADMIN_*` / `JWT_SECRET` credentials.
