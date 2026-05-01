# Assumptions and Design Decisions

## Overview

This document outlines the key assumptions and design decisions made while building the **Rehab Patient Tracking System**. The system is designed to reflect real-world rehabilitation workflows while maintaining clarity, modularity, and ease of understanding.

---

## Design Approach

* Focus on clear separation of concerns using a microservices-based structure
* Emphasis on maintainability, readability, and modular design
* Balanced use of real-world practices with streamlined implementation
* Designed to demonstrate end-to-end system flow: frontend → API gateway → services → database

---

## Domain Assumptions

These decisions define how the system models real-world rehab workflows.

### Two roles with clinician-driven workflow

The system supports two roles: `admin` and `therapist`. Patients are managed by clinical staff, and their records are maintained by therapists and administrators.

This aligns with typical rehabilitation workflows where clinicians manage patient treatment and documentation.

---

### One progress entry per session

Each therapy session has exactly one progress entry.

This keeps the patient recovery timeline simple and structured. The database enforces this rule using a `UNIQUE(session_id)` constraint.

---

### Session scheduling and availability

* Completed sessions reflect actual therapist availability and remain fixed
* Cancelled sessions are treated as unused slots and can be rescheduled

This mirrors real-world scheduling behavior in clinical environments.

---

### Flexible session types

Session types (e.g., physiotherapy, speech therapy) are stored as flexible string values.

This allows the system to adapt to different clinic terminologies without requiring schema changes.

---

### Therapist-based scheduling validation

Session overlap validation is handled at the therapist level.

This ensures that therapists are not double-booked while allowing flexibility in patient scheduling when multiple therapists are involved.

---

## Architecture Assumptions

These decisions define how the system is structured internally.

### Shared database with logical ownership

All services interact with a single PostgreSQL database (`rehab_db`), with each service responsible for its own tables.

This approach ensures:

* Strong data consistency
* Simplified data relationships
* Clear ownership boundaries

---

### Independent service design

Each service operates independently and focuses on a specific domain:

* `auth-service` → authentication and user management
* `patient-service` → patient data management
* `therapy-service` → sessions and progress tracking

This separation improves modularity and scalability.

---

### API Gateway as a routing layer

The API Gateway acts as a centralized entry point that routes requests to appropriate services.

Each service independently handles authentication and validation, enabling flexibility and independent testing.

---

### Self-contained services

Each service includes its own database connection and authentication middleware.

This design keeps services self-sufficient and easy to understand without external dependencies.

---

## Implementation Choices

These decisions relate to specific technology and coding practices.

### Use of bcryptjs

`bcryptjs` is used for password hashing due to its portability and ease of setup across environments.

---

### Modern JavaScript (ES Modules)

The project uses ES module syntax (`import/export`) for consistency with modern JavaScript standards.

---

### Lightweight frontend design

The frontend is implemented using React with minimal external dependencies, focusing on:

* Component reusability
* Clear state management
* Efficient API integration

---

### Inline visualization for progress

Progress trends are visualized using inline SVG instead of external charting libraries.

This keeps the implementation lightweight while maintaining clarity.

---

## Security Considerations

These decisions ensure secure handling of data and authentication.

### Consistent authentication responses

Authentication errors use consistent messaging to ensure secure handling of login attempts.

---

### Controlled data updates

APIs accept only explicitly defined fields, ensuring controlled and predictable updates.

---

### Secure password handling

Passwords are securely hashed and excluded from all API responses.

---

### Environment-based configuration

Sensitive values such as JWT secrets are stored in environment variables and managed securely.

---

### Graceful error handling

Database errors (e.g., invalid references) are translated into clear and user-friendly API responses.

---

## Scope Considerations

The system focuses on core functionality required for effective patient tracking and therapy management, including:

* Patient lifecycle management
* Therapy session scheduling
* Progress tracking and visualization
* Role-based access control

Additional enhancements such as advanced analytics, notifications, and extended integrations can be incorporated as future extensions.

---

## Summary

The system is designed to provide a clear, modular, and practical implementation of a rehabilitation patient tracking workflow. It demonstrates strong alignment between domain requirements, system architecture, and implementation decisions while maintaining flexibility for future enhancements.
