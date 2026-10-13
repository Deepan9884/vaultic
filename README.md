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
