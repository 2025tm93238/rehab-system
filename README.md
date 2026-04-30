# Rehab Patient Tracking System

A full-stack web application to help rehabilitation clinics track patient therapy sessions, monitor recovery progress, and maintain structured records with role-based access for therapists and administrators.

Built as part of the BITS Pilani SE ZG503 Full Stack Application Development course.

## Problem

Rehabilitation clinics often struggle to track patient therapy sessions, monitor recovery progress, and maintain structured records. Manual tracking leads to inconsistent documentation and poor visibility into patient outcomes. This system provides a centralized platform to manage patient registration, therapy sessions, and progress tracking.

## Architecture

```
React Frontend  →  API Gateway  →  Microservices  →  PostgreSQL
                                   ├─ auth-service
                                   ├─ patient-service
                                   └─ therapy-service
```

## Repository layout

| Folder | Purpose | Port |
|---|---|---|
| `api-gateway/` | Single entry point, proxies requests to backend services | 4000 |
| `auth-service/` | User registration, login, JWT issuance, role-based access | 4001 |
| `patient-service/` | Patient registration and patient record CRUD | 4002 |
| `therapy-service/` | Therapy session scheduling, logging, and progress tracking | 4003 |
| `frontend/` | React + Vite single-page application | 5173 |
| `docs/` | API specification, DB schema, architecture diagrams, AI usage log |

## Tech stack

- **Frontend**: React, Vite, React Router, Axios
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (single shared instance, each service owns its tables)
- **Auth**: JSON Web Tokens (JWT)

## Getting started

Setup instructions per service will be added as each service is implemented. See each subfolder's `README.md` for service-specific details.

## Documentation

- [`docs/AI_USAGE.md`](docs/AI_USAGE.md) — log of AI-assisted development (prompts, outputs, manual edits)
- API spec, DB schema, and architecture diagram will be added in `docs/`
