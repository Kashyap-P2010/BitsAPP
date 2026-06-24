# BITSAT LR Grind

A local-first, offline-capable Logical Reasoning study app for BITSAT preparation.

## Stack
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **SQLite** via **Prisma**
- **Recharts**

## Setup

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run db:push` | Push schema to SQLite |
| `npm run db:seed` | Seed real questions into DB |
| `npm run db:studio` | Open Prisma Studio |
| `npm run build` | Production build |

## Question Sources

All questions are sourced from:
- IndiaBIX (indiabix.com)
- ExamVeda (examveda.com)
- RS Aggarwal Verbal Reasoning
- Previous BITSAT papers (bits-pilani.ac.in)

**No questions are AI-generated.** Every question has a source name and URL stored in the database.

## Adding More Questions

Edit `data/questions.json` and run `npm run db:seed` again. Duplicate questions are automatically skipped.

## Features

- ✅ SM-2 Spaced Repetition System
- ✅ 5 Practice Modes (Daily, Topic, Weak, Mistakes, Mock)
- ✅ BITSAT Readiness Score (0-100)
- ✅ Analytics: accuracy trend, topic radar, heatmap
- ✅ XP + Level system
- ✅ Streak tracking
- ✅ 100% offline after install
- ✅ No accounts, no cloud
