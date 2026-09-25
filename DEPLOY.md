# Deploy to Vercel

Vite SPA + Personio:

- **Jobs list**: browser fetches public XML (`https://{subdomain}.jobs.personio.de/xml`) — no serverless needed (CORS `*`).
- **Apply**: `api/apply.cjs` (CommonJS) → Personio Recruiting API. Uses `.cjs` so it works with root `"type": "module"`.

Local development: `pnpm dev` (Vite + Hono on `:8787`, proxy `/api/apply`).

## 1. Push to GitHub

Do **not** commit `.env`.

## 2. Import on Vercel

1. [vercel.com](https://vercel.com) → Import repo.
2. Framework: **Vite** — build `pnpm build`, output `dist`.

## 3. Environment variables

| Name | Required | Notes |
|------|----------|--------|
| `PERSONIO_COMPANY_ID` | Yes (apply) | Recruiting API credentials |
| `PERSONIO_ACCESS_TOKEN` | Yes (apply) | Recruiting API credentials |
| `PERSONIO_RECRUITING_CHANNEL_ID` | No | Settings → Recruiting → Channels |
| `VITE_PERSONIO_SUBDOMAIN` | No | Default `attolabs` (jobs XML feed) |

Redeploy after changing env vars. `VITE_*` is baked in at **build** time.

## 4. Verify

- `/careers` → See open roles (Network: `jobs.personio.de/xml`, not `/api/jobs`).
- Apply with a small CV → candidate appears in Personio.

## 5. Limits (Hobby)

CV body ≈ **4.5 MB** max on Vercel Hobby.
