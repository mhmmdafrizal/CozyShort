# CozyShort

A cozy, minimal URL shortener built with Next.js and React. Paste a long link and get a short one instantly via TinyURL, with one-click copy, a recent-links history stored in your browser, dark/light theme toggle, and a custom clear-history confirm dialog. No accounts, no backend database — everything stays on your device.

## Screenshot

![Desktop Mode](./public/screenshot/Screenshot.png)

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

## npm Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Run Playwright end-to-end + security tests |
| `npm run knip` | Find unused dependencies/files/exports |

## Testing

End-to-end and security tests use [Playwright](https://playwright.dev) and run against a **production build** on port `3100` (avoids collisions with other dev servers on `3000`):

```bash
npm run test:e2e
```

First run downloads the Chromium browser:

```bash
npx playwright install chromium
```

Coverage:

- **UI flow:** homepage renders, shorten → result + recent-history, invalid input rejected client-side, clear-history confirm dialog, theme toggle.
- **API security:** missing `url` → 400; `javascript:`/`file:`/`data:`/`ftp:` schemes → 400 before proxying; http/https still proxied to TinyURL.
- **Headers:** the homepage must send `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and a `Content-Security-Policy`.

## Security

- **Server-side URL validation** — `/api/shorten` rejects any non-`http`/`https` scheme (the client also rejects unknown schemes before auto-prefixing `https://`).
- **Security headers + CSP** — `nosniff`, `DENY` framing, strict referrer, permissions policy, and a CSP (`default-src 'self'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`). CSP uses `'unsafe-inline'` for scripts per the Next.js "without nonces" guidance; upgrade to a nonce-based policy (`proxy.ts`) if the app ever handles sensitive data.
- **Known limitation:** no rate limit on `/api/shorten` — fine for a local tool, add one before public deployment (e.g. `@upstash/ratelimit`).

## Code Hygiene

[Knip](https://knip.dev) reports unused dependencies, files, and exports:

```bash
npm run knip
```

## Endpoints

| Route | Description |
|-------|-------------|
| `/` | Shortener UI |
| `GET /api/shorten?url=<encoded-url>` | Server-side proxy to TinyURL's legacy API; returns the short URL as plain text |
