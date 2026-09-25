# Deploy to Vercel

This project is a Vite SPA with Personio API routes as classic Vercel Node functions:

- `api/jobs.ts` → `GET /api/jobs`
- `api/apply.ts` → `POST /api/apply`
- Shared logic: `api/lib/personio.ts`
- API TypeScript config: `api/tsconfig.json` (CommonJS — required because root `package.json` has `"type": "module"`)

Local development still uses the Hono server in `server/` (`pnpm dev`).

## 1. Push to GitHub

Commit the project and push to a GitHub repository. Do **not** commit `.env` (already in `.gitignore`).

## 2. Import on Vercel

1. Open [vercel.com](https://vercel.com) and sign in.
2. **Add New Project** → Import your GitHub repo.
3. Framework Preset: **Vite** (or leave auto-detect).
4. Build settings (also in `vercel.json`):
   - Build Command: `pnpm build`
   - Output Directory: `dist`
5. Install Command: `pnpm install` (if prompted).

## 3. Environment variables

In Project → **Settings → Environment Variables**, add for **Production** and **Preview**:

| Name | Required | Example |
|------|----------|---------|
| `PERSONIO_COMPANY_SUBDOMAIN` | Yes | `attolabs` |
| `PERSONIO_COMPANY_ID` | Yes | from Personio Recruiting API credentials |
| `PERSONIO_ACCESS_TOKEN` | Yes | from Personio Recruiting API credentials |
| `PERSONIO_RECRUITING_CHANNEL_ID` | No | channel id from Settings → Recruiting → Channels |

Redeploy after saving env vars so functions pick them up.

## 4. Deploy

Click **Deploy**, or push to the connected branch.

After deploy, check:

- `https://YOUR_PROJECT.vercel.app/api/jobs` — JSON list of roles
- `/careers` → open roles → Apply with a small CV

## 5. Limits (Hobby)

- Request body size on Vercel Hobby is about **4.5 MB**. Larger CVs will fail even though Personio allows up to 20 MB. Prefer compressed PDFs under ~4 MB.
- Function `maxDuration` is set to **30s** for apply + document upload.

## Local development

Unchanged:

```bash
pnpm dev
```

This runs Vite + the local Hono server on port `8787` with `.env` via `dotenv`. Vercel Functions are not required for local work.
