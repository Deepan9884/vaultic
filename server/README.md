# Vaultic Server

Express 4 + Mongoose 8 + JWT + semantic search (MiniLM-L6-v2, 384-dim, cosine fallback).

## Setup

```bash
cd server
npm install
cp .env.example .env
# edit MONGO_URI / JWT_SECRET
npm run seed
npm run dev
```

Health: `GET http://localhost:5000/api/health`

## Env

| Key | Default |
|---|---|
| PORT | 5000 |
| MONGO_URI | mongodb://127.0.0.1:27017/vaultic |
| JWT_SECRET | changeme |
| JWT_EXPIRES_IN | 1h |
| CLIENT_URL | http://localhost:5173 |
| EMBEDDING_PROVIDER | local (`hash` forces offline fallback) |
| ADMIN_SECRET | (optional) required to signup as admin |

## Scripts

- `npm run dev` — nodemon `src/index.js`
- `npm start` — node `src/index.js`
- `npm run seed` — seed admin/manager/employee + samples
- `npm run reindex` — re-extract + re-embed all docs into `documentchunks`

Seed logins (password `password123`): `admin@vaultic.local`, `manager@vaultic.local`, `employee@vaultic.local`

## API

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | /api/auth/signup | no | name,email,password,team?,role(manager)?,adminSecret? |
| POST | /api/auth/login | no | email,password |
| GET | /api/auth/me | JWT | |
| GET | /api/users | admin | ?q=&role=&team=&page=&limit= |
| PATCH | /api/users/:id/role | admin | {role} |
| PATCH | /api/users/:id/status | admin | {isActive} |
| POST | /api/documents (multipart `file`) | JWT | title,description,category,team,visibility,tags |
| GET | /api/documents | JWT | ?q=&category=&status(admin)=&team=&page=&limit= |
| GET/PATCH/DELETE | /api/documents/:id | JWT | visibility-filtered; owner/admin for write |
| POST | /api/documents/:id/approve | admin | |
| POST | /api/documents/:id/reject | admin | |
| POST | /api/documents/:id/share | owner/manager/admin | {userIds:[]} |
| GET | /api/search?q=&category=&topK= | JWT | semantic search |
| GET/POST | /api/faqs | JWT | |
| GET/PATCH/DELETE | /api/faqs/:id | JWT | |
| GET/POST | /api/bookmarks | JWT | {documentId} |
| DELETE | /api/bookmarks/:id | JWT | bookmark id or document id |
| GET | /api/analytics/overview | admin | counts + storage + by-category |
| GET | /api/analytics/searches | admin | last 50 searches |
| GET | /api/analytics/activity | admin | ?action=&page=&limit= |

Errors: `{ success:false, message }`.

## Atlas Vector Search (optional)

In-memory cosine works out of the box. For scale, create an Atlas Vector index on `documentchunks`:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 384, "similarity": "cosine" },
    { "type": "filter", "path": "status" },
    { "type": "filter", "path": "category" },
    { "type": "filter", "path": "team" }
  ]
}
```

Then replace the `find().limit(2000)` block in `src/services/searchService.js` with a `$vectorSearch` aggregation on `embedding` using the query vector, with `+ canAccessDoc` post-filter.
