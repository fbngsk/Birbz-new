# BirdNerd - Vogelsammlung App

Eine gamifizierte Vogelbeobachtungs-App für Deutschland.

## Features

- 🐦 322+ Vogelarten in der Datenbank
- 📷 KI-gestützte Vogelerkennung (Foto, Audio, Beschreibung)
- 🏆 XP-System, Badges und Streaks
- 🗺️ Community Map
- 👥 Leaderboard mit Freundeskreis ("Circle")
- 📱 PWA für mobile Nutzung

## Tech Stack

- React 18 + TypeScript
- Tailwind CSS
- Vite
- Supabase (Auth & Database)
- Google Gemini (Bird AI)

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/fbngsk/Birbz-.git
cd Birbz-
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Get your Gemini API key from: https://aistudio.google.com/app/apikey

Note: Supabase credentials are already configured in `constants.ts`.

### 3. Run Locally

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

## Deploy to Vercel

### Option A: Connect GitHub (Recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variable: `VITE_GEMINI_API_KEY`
5. Deploy

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel
```

## Project Structure

```
├── public/
│   ├── manifest.json      # PWA manifest
│   └── icon.png           # App icon (add your own)
├── src/
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Supabase client
│   ├── services/          # API services (Gemini, Wiki)
│   ├── constants.ts       # Bird database, badges, config
│   ├── types.ts           # TypeScript types
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## Icon

Add your app icon as `public/icon.png` (192x192 or larger).
