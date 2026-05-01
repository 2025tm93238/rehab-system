# Frontend

React single-page application for the Rehab Patient Tracking System.

- Tooling: Vite + React + React Router + Axios
- Dev port: `5173`
- Talks to the API Gateway at `http://localhost:4000` via Vite's dev proxy (configured in `vite.config.js`)

## Local setup

```bash
cd frontend
npm install
cp .env.example .env       # defaults are fine for local dev
npm run dev
```

The dev server starts on `http://localhost:5173`. All four backend services (`api-gateway`, `auth-service`, `patient-service`, `therapy-service`) must be running first.

## Pages

| Route | Page | Notes |
|---|---|---|
| `/login` | Login | (Phase 10) |
| `/signup` | Signup | (Phase 10) |
| `/dashboard` | Dashboard | Protected. Stats land in Phase 13. |
| `/patients` | Patients list | Protected. (Phase 11) |
| `/patients/:id` | Patient detail | Protected. Sessions and progress timeline. (Phase 11–13) |
| `/sessions` | Session list | Protected. (Phase 12) |
| `/sessions/:id` | Session detail | Protected. (Phase 12–13) |

## Architecture notes

- **`src/api/client.js`** — Axios instance with `VITE_API_BASE_URL` (defaults to `/api`, proxied to gateway in dev). Request interceptor attaches the JWT from `localStorage`. Response interceptor clears the token on 401 so the auth context can react.
- **`src/auth/AuthContext.jsx`** — React context exposing `user`, `login()`, `signup()`, `logout()`. Persists user + token in `localStorage` so refreshes don't kick the user out.
- **`src/auth/ProtectedRoute.jsx`** — wrapper that redirects to `/login` if no user is in context, and to `/dashboard` if the user lacks the required role (RBAC at the UI layer; the backend re-checks too).
- **`src/components/Navbar.jsx`** — top nav with active-link highlighting and logout.
- **`src/pages/`** — one component per route.

## Build

```bash
npm run build       # outputs to dist/
npm run preview     # serve the prod build locally
```
