# Meal Expense Tracker

A simple daily meal expense tracker. Each day starts with a $100 budget; log what you spend and email yourself a summary of the day.

## Features

- **Daily $100 budget** – the balance resets automatically each new day.
- **Quick entry** – one-tap buttons for frequent stores (Whole Foods, ShopRite, Weis, Dunkin'), and merchant autocomplete that puts names starting with what you type and your most-used places first. Press Enter or Tab to accept a suggestion.
- **Edit or delete entries** – change the merchant, amount, note or time. The time sets the meal emoji (🌅 breakfast, ☀️ lunch, 🌙 evening).
- **Email the day's report** – opens your mail app with a summary of every entry, the total spent and the remaining balance.
- **Past days** – use the ‹ › arrows to go back and email a report you forgot to send. The last 30 days are kept.

## Where data is stored

There is no server or database. Entries are saved in the browser's `localStorage`, so:

- Each device and browser has its own separate data. Anyone else using the link has their own private history.
- Clearing browser data erases the history.
- On iPhone, adding the app to the Home Screen (Share → Add to Home Screen) keeps Safari from clearing it after a week of no visits.

## Development

Built with [Next.js](https://nextjs.org) 15 and React 19. All of the app's logic is in `src/app/page.js`.

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
```

The app icons are generated from code in `src/app/iconArt.js` (`icon.js` for the browser tab, `apple-icon.js` for the iPhone home screen).

> **Note:** `npm run build` fails locally if the project folder path contains an apostrophe (e.g. `Tim's Coding Projects`) because of a Next.js bug. `npm run dev` and Vercel deployments are unaffected.

## Deployment

Hosted on Vercel. Pushing to `main` deploys automatically.
