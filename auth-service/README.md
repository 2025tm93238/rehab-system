# Auth Service

Handles user registration, login, and JWT-based authentication. Supports two roles: `admin` and `therapist`.

- Port: `4001`
- Endpoints (planned):
  - `POST /register` — register a new user (admin or therapist)
  - `POST /login` — authenticate and return a JWT
  - `GET /me` — return the current user (verified via JWT)

Implementation pending.
