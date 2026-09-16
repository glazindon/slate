# Slate

Dead-simple invoicing for freelancers and small businesses. Create an invoice in under a minute, share a public link, mark it paid.

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- **Durable store:** [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (`BLOB_READ_WRITE_TOKEN`)
- Local fallback: JSON file under `data/` when the Blob token is absent (dev only)
- Creator identity via httpOnly cookie (`slate_creator`)

## Production setup (required)

On Vercel, filesystem writes fail. Provision Blob storage:

1. Open the **slate-invoice** project in the Vercel dashboard
2. **Storage → Create Database → Blob** (name e.g. `slate-invoices`)
3. Connect it to the project for **Production** (and Preview if desired)
4. Vercel injects `BLOB_READ_WRITE_TOKEN` automatically — redeploy after connecting

Until that token is present on the deployment, `POST /api/invoices` will error with a clear message.

### Alternative env (same SDK)

| Variable | Required | Notes |
|----------|----------|-------|
| `BLOB_READ_WRITE_TOKEN` | Yes (prod) | From the Blob store connection |
| `BLOB_STORE_ID` | Optional | Only if using OIDC instead of the RW token |

## Quick start (local)

```bash
cd /workspace/slate
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Local mode uses `data/invoices.json` when no Blob token is set.

To exercise Blob locally:

```bash
cp .env.example .env.local
# paste BLOB_READ_WRITE_TOKEN from the Vercel store
npm run dev
```

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

- Invoice JSON is stored privately in Blob at `invoices/{id}.json`; creator indexes at `creators/{token}.json`.
- Mark as paid requires the same browser/cookie that created the invoice.
- Public invoice footer shows “Sent with Slate”.
- Out of scope: auth/SSO, Stripe, email, taxes, recurring.

## Design

Slate/zinc/ink palette, Instrument Serif + DM Sans, generous whitespace.
