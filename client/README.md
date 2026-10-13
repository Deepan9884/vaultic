# Vaultic Client

React 18 + Vite 5 + Tailwind 3 frontend for Vaultic.

## Setup

```bash
cd client
cp .env.example .env
npm install
```

## Run

```bash
npm run dev     # http://localhost:5173 (proxies /api -> http://localhost:5000)
npm run build
npm run preview
```

## Env

- `VITE_API_URL` — API base URL (default `/api`, proxied to `http://localhost:5000` in dev).

## Routes

- `/login`, `/register` (public)
- `/` Dashboard, `/browse`, `/docs/:id`, `/search`, `/faqs`, `/bookmarks` (auth)
- `/upload` (manager/admin)
- `/admin/users`, `/admin/approvals`, `/admin/analytics` (admin)

All API paths live under `/api`.
