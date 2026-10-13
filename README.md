# Vaultic — Role-Gated Knowledge Portal with Semantic Search

MERN: React Vite + Tailwind | Express + Mongoose | JWT + RBAC | local embeddings (MiniLM 384-d, hash fallback offline).

## Structure
- `server/` — Express API (see server/README.md)
- `client/` — React app (see client/README.md)

## Quick start (DB details come later)
1. `cd server && cp .env.example .env` — set `MONGO_URI`, `JWT_SECRET`
2. `npm install; npm run seed; npm run dev` (port 5000)
3. `cd ../client && npm install; npm run dev` (port 5173)

## Semantic search
Upload → extract (pdf-parse/mammoth) → chunk (~600 chars/100 overlap) → embed (Xenova all-MiniLM-L6-v2) → `DocumentChunk` → query embed → cosine rank → group by doc. Atlas Vector Search index JSON is in server/README.md; current code uses in-memory cosine over last 2000 chunks so it works on any MongoDB, swap to `$vectorSearch` when on Atlas.

## RBAC
`buildDocFilter` + `canAccessDoc` enforce server-side: admin=all, team=public+own team, private=owner/allowedUsers only. Status must be `approved`.

## Production deploy
1. Copy env: `cp server/.env.example server/.env` and set `MONGO_URI` (Atlas), a strong `JWT_SECRET`, `CLIENT_URL` (your frontend origin), and `GEMINI_API_KEY` (enables generative Ask answers). Never commit `.env`.
2. Run the API with a process manager: `cd server && npm install --omit=dev && NODE_ENV=production node src/index.js` (PM2, systemd, or a Render/Railway Web Service — boot refuses to start without `MONGO_URI` + a strong `JWT_SECRET`).
3. Frontend: `cd client && VITE_API_URL=https://api.example.com/api npm run build`, then host `dist/` on Vercel/Netlify/Render static (set `VITE_API_URL` in their dashboard instead of baking it in).
4. Put TLS in front (Cloudflare, ALB, or Caddy/Nginx reverse proxy). The API sets `trust proxy` so rate limits see real client IPs.
5. Back up MongoDB on a schedule (`mongodump` or Atlas backups) and snapshot the `uploads` volume — files live on disk, not in the DB.
6. Verify: `GET /api/health` (checks DB + uptime), then `cd server && npm run smoke` for the full 50+ check suite.
