# Patient Service

Manages patient records — registration, retrieval, updates, and removal.

- Port: `4002`
- Endpoints (all require `Authorization: Bearer <token>` from auth-service):
  - `GET    /health` — service health probe
  - `POST   /patients` — register a new patient (admin or therapist)
  - `GET    /patients` — list patients; supports `?status=`, `?therapistId=`, `?search=`
  - `GET    /patients/:id` — retrieve a patient
  - `PUT    /patients/:id` — update a patient
  - `DELETE /patients/:id` — remove a patient (**admin only**)

## Database setup (one-time)

The auth-service's `users` table must already exist (because `patients.assigned_therapist_id` references it).

```bash
psql -h localhost -U postgres -d rehab_db -f patient-service/db/schema.sql
```

## Local setup

```bash
cd patient-service
npm install
cp .env.example .env       # then edit .env — JWT_SECRET MUST match auth-service's
npm start
```

The service starts on `http://localhost:4002`.

## Try the endpoints

First, get a JWT from auth-service:

```bash
TOKEN=$(curl -s -X POST http://localhost:4001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@clinic.test","password":"secret123"}' | jq -r .token)
```

### Create a patient

```bash
curl -X POST http://localhost:4002/patients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ravi Kumar",
    "age": 52,
    "gender": "male",
    "contact": "+91 98xxxxxx",
    "diagnosis": "Post-op knee replacement, weeks 1-6 rehab plan",
    "assigned_therapist_id": 1
  }'
```

### List, filter, search

```bash
curl "http://localhost:4002/patients?status=active" -H "Authorization: Bearer $TOKEN"
curl "http://localhost:4002/patients?therapistId=1" -H "Authorization: Bearer $TOKEN"
curl "http://localhost:4002/patients?search=ravi" -H "Authorization: Bearer $TOKEN"
```

### Update / Delete

```bash
curl -X PUT http://localhost:4002/patients/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "discharged"}'

# Delete is admin-only — therapist tokens get 403
curl -X DELETE http://localhost:4002/patients/1 -H "Authorization: Bearer $TOKEN"
```

## Auth model

This service does NOT issue tokens. It verifies JWTs issued by `auth-service` using the shared `JWT_SECRET`. Standard "shared-nothing" microservice pattern — each service owns its tables and ships its own copy of the auth middleware.
