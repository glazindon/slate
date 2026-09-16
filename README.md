# Slate

Dead-simple invoicing for freelancers and small businesses. Create an invoice in under a minute, share a public link, mark it paid.

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- JSON file store under `data/` (no database required)
- Creator identity via httpOnly cookie (`slate_creator`)

## Quick start

```bash
cd /workspace/slate
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Serve production build |

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing |
| `/new` | Create invoice |
| `/i/[id]` | Public invoice (copy link, print, mark paid) |
| `/invoices` | List invoices created in this browser |

## Persistence

- **Local** (`next dev` / `next start`): invoices persist in `data/invoices.json` (gitignored).
- **Vercel**: set `SLATE_GITHUB_TOKEN` to a GitHub token with **Contents: Read and write** on `glazindon/slate`. The app stores invoices via the GitHub Contents API at `data/invoices.json` on `main`.

Optional overrides: `SLATE_GITHUB_REPO` (default `glazindon/slate`), `SLATE_GITHUB_BRANCH` (default `main`).

## Notes

- Mark as paid requires the same browser/cookie that created the invoice.
- Public invoice footer shows “Sent with Slate”.
- Out of scope: auth/SSO, Stripe, email, taxes, recurring.

## Design

Slate/zinc/ink palette, Instrument Serif + DM Sans, generous whitespace.
