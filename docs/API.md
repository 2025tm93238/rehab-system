# API Reference — Rehab Patient Tracking System

## Base URL

```
http://localhost:4000/api
```

All endpoints are exposed via the **API Gateway**.

---

## Architecture Note

All endpoints below are documented as the **frontend sees them** (via the API gateway).
Internally, the gateway strips `/api/...` and forwards requests to the respective microservice.

---

## Authentication

All endpoints require:

```
Authorization: Bearer <JWT>
```

### Exceptions

* `POST /api/auth/register`
* `POST /api/auth/login`

### Roles

* `admin`
* `therapist`

### Authorization Rules

* Only `admin` can delete patients
* All other actions allowed for authenticated users

---

## Error Handling

All error responses follow this format:

```json
{
  "error": "Human-readable message"
}
```

### Common Status Codes

* `400` — Validation error / bad request
* `401` — Unauthorized (invalid/missing token)
* `403` — Forbidden (role restriction)
* `404` — Resource not found
* `409` — Conflict (e.g., duplicate or overlapping data)
* `502` — Upstream service unavailable

---

## API Overview

| Service   | Endpoint                        | Description      |
| --------- | ------------------------------- | ---------------- |
| Auth      | POST /api/auth/register         | Register user    |
| Auth      | POST /api/auth/login            | Login user       |
| Auth      | GET /api/auth/me                | Get current user |
| Patients  | POST /api/patients              | Create patient   |
| Patients  | GET /api/patients               | List patients    |
| Sessions  | POST /api/sessions              | Create session   |
| Sessions  | GET /api/sessions               | List sessions    |
| Progress  | POST /api/sessions/:id/progress | Add progress     |
| Dashboard | GET /health                     | Gateway health   |

---

## Typical Workflow

1. Register user → `POST /api/auth/register`
2. Login → receive JWT
3. Create patient → `POST /api/patients`
4. Schedule session → `POST /api/sessions`
5. Update session status (completed)
6. Add progress → `POST /api/sessions/:id/progress`
7. View patient progress timeline

---

## Business Rules

* Therapists **cannot have overlapping sessions**
* Progress can be added **only after session is completed**
* Each session can have **only one progress record**
* Deleting patients is **restricted to admin users**

---

# Auth — `auth-service`

## POST /api/auth/register

Create a new user account.

### Request

```json
{
  "name": "Jane Therapist",
  "email": "jane@clinic.test",
  "password": "secret123",
  "role": "therapist"
}
```

### Validation

* All fields required
* Email must be valid
* Password ≥ 6 characters
* Role: `admin` or `therapist`

### Response 201

```json
{
  "id": 1,
  "name": "Jane Therapist",
  "email": "jane@clinic.test",
  "role": "therapist",
  "created_at": "2026-04-30T09:04:43.310Z"
}
```

### Errors

* `400` invalid input
* `409` email already exists

---

## POST /api/auth/login

### Request

```json
{
  "email": "jane@clinic.test",
  "password": "secret123"
}
```

### Response 200

```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "name": "Jane Therapist",
    "email": "jane@clinic.test",
    "role": "therapist"
  }
}
```

### Errors

* `400` missing fields
* `401` invalid credentials

---

## GET /api/auth/me

### Response 200

```json
{
  "id": 1,
  "name": "Jane Therapist",
  "email": "jane@clinic.test",
  "role": "therapist",
  "created_at": "2026-04-30T..."
}
```

---

# Patients — `patient-service`

## POST /api/patients

### Request

```json
{
  "name": "Ravi Kumar",
  "age": 52,
  "gender": "male",
  "contact": "+91 98xxxxxxxx",
  "diagnosis": "Post-op knee replacement",
  "assigned_therapist_id": 1,
  "status": "active",
  "admission_date": "2026-04-30"
}
```

### Validation

* Required: `name`, `age`, `gender`, `diagnosis`
* Age: 0–150
* Gender: male/female/other
* Status: active/discharged

### Response 201

Patient object

---

## GET /api/patients

### Query Params

* `status`
* `therapistId`
* `search`

### Response

Array of patients

---

## GET /api/patients/:id

* `200` success
* `404` not found

---

## PUT /api/patients/:id

Partial update allowed

---

## DELETE /api/patients/:id

* Admin only
* `204` success
* `403` forbidden

---

# Sessions — `therapy-service`

## POST /api/sessions

### Request

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

### Validation

* Duration: 1–480 mins
* Valid ISO date
* Valid patient + therapist

### Business Logic

* Prevent overlapping sessions for therapist

### Errors

* `409` conflict with existing session

---

## GET /api/sessions

Filters:

* `patientId`
* `therapistId`
* `status`

---

## PUT /api/sessions/:id

* Allows rescheduling
* Overlap validation rechecked

---

# Progress — `therapy-service`

## POST /api/sessions/:id/progress

### Request

```json
{
  "pain_level": 6,
  "mobility_score": 4,
  "summary": "Improvement observed"
}
```

### Rules

* Only for completed sessions
* One entry per session

### Errors

* `400` session not completed
* `409` already exists

---

## GET /api/sessions/:id/progress

Returns progress or 404

---

## PUT /api/sessions/:id/progress

Update existing progress

---

# Patient Progress Timeline

## GET /api/patients/:patientId/progress

### Response

```json
[
  {
    "session_id": 1,
    "scheduled_at": "...",
    "pain_level": 6,
    "mobility_score": 3
  }
]
```

---

# API Gateway

## GET /health

```json
{
  "service": "api-gateway",
  "status": "ok",
  "routes": {}
}
```

---

## Failure Modes

### 404

```json
{
  "error": "route not found at gateway"
}
```

### 502

```json
{
  "error": "upstream service unavailable"
}
```

---

## Notes

* All services communicate via REST
* Gateway handles routing and error translation
* Designed using microservices architecture within a monorepo
