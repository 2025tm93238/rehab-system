# API Gateway

Single entry point for the frontend. Proxies incoming requests to the appropriate backend microservice.

- Port: `4000`
- Routes:
  - `/api/auth/*` → `auth-service` (port 4001)
  - `/api/patients/*` → `patient-service` (port 4002)
  - `/api/sessions/*` → `therapy-service` (port 4003)
  - `/api/progress/*` → `therapy-service` (port 4003)

Implementation pending.
