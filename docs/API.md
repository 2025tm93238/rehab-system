# API reference

All endpoints below are documented as the **frontend sees them** (via the API gateway at `http://localhost:4000`). Internally the gateway strips `/api/...` and forwards to the relevant microservice. See `ARCHITECTURE.md` for routing rules.

**Auth model**: every endpoint except `POST /api/auth/register` and `POST /api/auth/login` requires `Authorization: Bearer <token>` from `/api/auth/login`. `DELETE /api/patients/:id` additionally requires the `admin` role.

**Error envelope**: all 4xx and 5xx responses return JSON like `{ "error": "human-readable message" }`. Some errors include extra context (e.g. `conflicting_session_id` on a 409).

---

## Auth — `auth-service`

### `POST /api/auth/register`

Create a new user account. Public.

**Request body**
```json
{
  "name": "Jane Therapist",
  "email": "jane@clinic.test",
  "password": "secret123",
  "role": "therapist"
}
```

**Validation**
- `name`, `email`, `password`, `role` — all required
- `email` — must match `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- `password` — minimum 6 characters
- `role` — `"admin"` or `"therapist"` only

**Response 201**
```json
{
  "id": 1,
  "name": "Jane Therapist",
  "email": "jane@clinic.test",
  "role": "therapist",
  "created_at": "2026-04-30T09:04:43.310Z"
}
```

**Errors**
- `400` missing fields, invalid email format, short password, bad role
- `409` email already registered

### `POST /api/auth/login`

Exchange credentials for a JWT. Public.

**Request body**
```json
{ "email": "jane@clinic.test", "password": "secret123" }
```

**Response 200**
```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": 1, "name": "Jane Therapist", "email": "jane@clinic.test", "role": "therapist" }
}
```

JWT claims: `sub` (user id), `email`, `role`, `iat`, `exp` (configurable, defaults to 1 day).

**Errors**
- `400` missing fields
- `401` invalid credentials (same message for unknown email and wrong password — deliberate: don't leak which emails exist)

### `GET /api/auth/me`

Current user (verified via the JWT).

**Response 200**
```json
{
  "id": 1, "name": "Jane Therapist", "email": "jane@clinic.test",
  "role": "therapist", "created_at": "2026-04-30T09:04:43.310Z"
}
```

**Errors**
- `401` missing/invalid/expired token

---

## Patients — `patient-service`

### `POST /api/patients`

Register a new patient. Any authenticated user.

**Request body**
```json
{
  "name": "Ravi Kumar",
  "age": 52,
  "gender": "male",
  "contact": "+91 98xxxxxxxx",
  "diagnosis": "Post-op knee replacement, weeks 1-6",
  "assigned_therapist_id": 1,
  "status": "active",
  "admission_date": "2026-04-30"
}
```

`name`, `age`, `gender`, `diagnosis` are required. Others are optional. `status` defaults to `"active"`. `admission_date` defaults to today.

**Validation**
- `age` — integer 0–150
- `gender` — `"male" | "female" | "other"`
- `status` — `"active" | "discharged"`
- `assigned_therapist_id` — must exist in `users` if supplied

**Response 201** — full patient record (same shape as `GET /:id`).

**Errors**
- `400` missing required fields, invalid age/gender/status, FK violation on `assigned_therapist_id`
- `401` no token

### `GET /api/patients`

List patients. Authenticated.

**Query params** (all optional)
- `?status=active` or `?status=discharged`
- `?therapistId=1`
- `?search=ravi` — case-insensitive name LIKE

**Response 200** — array of patient records.

### `GET /api/patients/:id`

**Response 200** — patient record. **404** if not found.

### `PUT /api/patients/:id`

Partial update. Any authenticated user.

**Request body** — any subset of: `name, age, gender, contact, diagnosis, assigned_therapist_id, status, admission_date`. Validation rules same as POST. Mass-assignment protected: only the whitelisted fields are accepted.

**Response 200** — updated patient record. **404** if not found.

### `DELETE /api/patients/:id`

**Admin only.** Returns **204** on success, **403** for therapist tokens, **404** if not found.

---

## Sessions — `therapy-service`

### `POST /api/sessions`

Schedule a therapy session.

**Request body**
```json
{
  "patient_id": 1,
  "therapist_id": 1,
  "scheduled_at": "2026-05-02T10:00:00Z",
  "duration_minutes": 45,
  "session_type": "physiotherapy",
  "notes": "Initial assessment"
}
```

**Validation**
- All except `notes` required
- `duration_minutes` — integer 1–480
- `scheduled_at` — any valid ISO 8601
- FKs to `patients` and `users` enforced

**Overlap protection**: if the same therapist already has a non-cancelled session whose `[start, start + duration)` interval overlaps the requested window, returns **409** with `conflicting_session_id`. Cancelled sessions free their slot; completed sessions still block (they happened).

**Response 201** — full session record.

### `GET /api/sessions`

List sessions, ordered `scheduled_at DESC`.

**Query params**: `?patientId=`, `?therapistId=`, `?status=` (any subset).

### `GET /api/sessions/:id`

Single session. 404 if not found.

### `PUT /api/sessions/:id`

Partial update.

**Request body** — any subset of: `status, notes, scheduled_at, duration_minutes`. If time fields change, the overlap check is re-run (excluding the row being edited).

**Errors**
- `400` invalid status / time / duration
- `404` not found
- `409` overlap on reschedule

---

## Progress (per session) — `therapy-service`

### `POST /api/sessions/:id/progress`

Record progress for a **completed** session. One progress entry per session (UNIQUE).

**Request body**
```json
{ "pain_level": 6, "mobility_score": 4, "summary": "Improved knee flexion, mild residual stiffness." }
```

**Validation**: `pain_level` and `mobility_score` integers 0–10; `summary` non-empty string.

**Response 201** — progress record.

**Errors**
- `400` missing/invalid fields, **or session not yet `completed`** (response includes the current `session_status`)
- `404` session not found
- `409` progress already recorded — use PUT to update

### `GET /api/sessions/:id/progress`

Fetch the progress entry. **404** if none yet recorded.

### `PUT /api/sessions/:id/progress`

Partial update. Same field validation. **404** if no entry exists yet.

---

## Patient progress timeline — `therapy-service`

### `GET /api/patients/:patientId/progress`

Chronological list of progress entries for a patient, joined with their sessions. **Empty array** if no completed sessions with progress (this is not a 404).

**Response 200**
```json
[
  {
    "session_id": 1, "scheduled_at": "2026-05-02T10:00:00.000Z",
    "session_type": "physiotherapy", "duration_minutes": 45, "therapist_id": 1,
    "progress_id": 1, "pain_level": 6, "mobility_score": 3,
    "summary": "Initial assessment, significant stiffness",
    "recorded_at": "2026-04-30T..."
  },
  ...
]
```

Ordered by `scheduled_at ASC` so the recovery arc reads left-to-right.

---

## Gateway

### `GET /health`

Gateway health probe. Returns the route table — useful for sanity-checking the deploy.

```json
{ "service": "api-gateway", "status": "ok", "routes": { ... } }
```

### Failure modes

- `404` — route not matched at the gateway. Body: `{ "error": "route not found at gateway", "path": "/api/..." }`
- `502` — downstream service unreachable. Body: `{ "error": "upstream service unavailable", "service": "patient-service" }`. Issued by the gateway when the proxy can't connect (e.g. service is down).
