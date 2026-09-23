# CozyShort

A cozy, minimal URL shortener built with Next.js and React. Paste a long link and get a short one instantly via TinyURL, with one-click copy, a recent-links history stored in your browser, dark/light theme toggle, and a custom clear-history confirm dialog. No accounts, no backend database — everything stays on your device.

## Features

- Shorten any http/https URL via TinyURL (proxied server-side through `/api/shorten`)
- One-click copy to clipboard
- Recent links history (last 8, stored in localStorage) with clear + confirm dialog
- Dark/light theme toggle (respects system preference)
- Responsive, works on mobile

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [React](https://react.dev) 19
- TypeScript
- Tailwind CSS 4 + custom CSS

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
npm run build
npm start
```

## Endpoints

| Route | Description |
|-------|-------------|
| `/` | Shortener UI |
| `GET /api/shorten?url=<encoded-url>` | Server-side proxy to TinyURL's legacy API; returns the short URL as plain text |
