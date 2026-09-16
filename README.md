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

## Notes

- Invoices persist in `data/invoices.json`.
- Mark as paid requires the same browser/cookie that created the invoice.
- Public invoice footer shows “Sent with Slate”.
- Out of scope: auth/SSO, Stripe, email, taxes, recurring.

## Design

Slate/zinc/ink palette, Instrument Serif + DM Sans, generous whitespace.
