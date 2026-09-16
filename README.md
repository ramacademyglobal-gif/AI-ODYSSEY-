# AI ODYSSEY — Official Hackathon Website

> “24 HOURS. ONE MISSION. INFINITE AI POSSIBILITIES.”

A premium, production-quality website for **AI ODYSSEY** — a 24-hour Artificial Intelligence Hackathon. Designed with a high-tech NASA × Mission Control aesthetic combining Cosmic Navy (`#071421`), Midnight Navy (`#0E1E31`), Champagne Gold (`#C5A15A`), and Warm Ivory (`#FAF9F6`).

---

## 🚨 IMPORTANT ARCHITECTURE NOTE: EXTERNAL REGISTRATION

**This project DOES NOT use internal databases, user logins, or backend registration APIs.**

All student registrations across the website are directed to an external **Google Form**. Every "Register Now" / "Join the Odyssey" CTA reads directly from `src/config/event.ts`.

---

## 🛠 Technology Stack

- **Framework**: Next.js 15+ (App Router, Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Animations**: Framer Motion & Custom CSS Orbit Keyframes
- **Utilities**: `clsx`, `tailwind-merge`, `date-fns`
- **Deployment**: Vercel

---

## 🚀 Getting Started

### 1. Installation

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Type Check & Lint

```bash
npm run typecheck
npm run lint
```

### 4. Production Build

```bash
npm run build
npm start
```

---

## ⚙️ How to Modify Event Details & Google Form Link

All core event information originates from a single central configuration file:

📁 **`src/config/event.ts`**

### Setting the Google Form Link:
Change `googleFormRegistrationUrl` in `src/config/event.ts`:

```typescript
export const EVENT_CONFIG = {
  // ...
  googleFormRegistrationUrl: "https://docs.google.com/forms/d/e/YOUR_REAL_FORM_ID/viewform",
  // ...
};
```

*Every registration button across all 16 pages will instantly update to use your configured link!*

---

## 🖼 Branding & Typography

- **Official Branding**: The `<Logo />` component renders the official typography with pulse indicator for AI Odyssey.

---

## 📂 Static Data Architecture

Modify or extend static event data cleanly without touching UI page components:

| Feature | Data File Path |
| :--- | :--- |
| **Central Event Config** | `src/config/event.ts` |
| **Problem Statements (10 Tracks)** | `src/data/challenges.ts` |
| **Schedule & Timeline** | `src/data/schedule.ts` |
| **Prizes & Opportunities** | `src/data/prizes.ts` |
| **Judging Criteria & Flow** | `src/data/judging.ts` |
| **Prizes & Perks** | `src/data/prizes.ts` |
| **Live Announcements Feed** | `src/data/announcements.ts` |
| **Odyssey Champions / Winners** | `src/data/winners.ts` |
| **Photo Gallery** | `src/data/gallery.ts` |

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the project in [Vercel](https://vercel.com).
3. Framework Preset: **Next.js**.
4. Click **Deploy**. No backend database or secret keys are required!

---

## 📄 License

Created for AI Odyssey. All rights reserved.
