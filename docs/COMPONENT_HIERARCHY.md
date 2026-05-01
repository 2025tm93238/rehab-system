# Component Hierarchy — Frontend (React)

This section describes the structure of the frontend application and how components are organized to build the user interface.

---

## Top-Level Structure

```
App
├── AuthProvider (global auth state)
├── Navbar
└── Routes
```

---

## Routing Structure

```
Routes
├── /login
│   └── Login
│
├── /signup
│   └── Signup
│
├── /dashboard
│   └── ProtectedRoute
│       └── Dashboard
│
├── /patients
│   └── ProtectedRoute
│       └── Patients
│           └── PatientForm (create)
│
├── /patients/:id
│   └── ProtectedRoute
│       └── PatientDetail
│           ├── PatientForm (edit)
│           ├── PatientSessions
│           │   ├── SessionForm (lockPatient=true)
│           │   └── SessionList
│           └── ProgressTimeline
│               └── TrendChart
│
├── /sessions
│   └── ProtectedRoute
│       └── Sessions
│           ├── SessionForm
│           └── SessionList
│
├── /sessions/:id
│   └── ProtectedRoute
│       └── SessionDetail
│           ├── SessionForm (edit/reschedule)
│           └── SessionProgress
│               └── ProgressForm
│
└── *
    └── NotFound
```

---

## Key Shared Components

* **Navbar** — navigation and logout
* **ProtectedRoute** — restricts access to authenticated users
* **AuthProvider** — manages user session and token

---

## Reusable Components

* **PatientForm** — used for both create and edit
* **SessionForm** — used for scheduling and updating sessions
* **SessionList** — reused across dashboard, patient view, and sessions page
* **ProgressForm** — used for adding and editing progress

---

## Supporting Components

* **TrendChart** — visual representation of patient progress
* **ScoreBar** — displays pain and mobility scores
* **Utility functions** — formatting and API helpers

---

## Data Flow Overview

* Authentication state is managed globally via `AuthProvider`
* API calls are handled through a centralized API client
* Components fetch data independently and render UI accordingly
* Shared components are reused to maintain consistency

---

## Summary

The frontend follows a modular and reusable component structure, enabling clear separation of concerns, efficient state management, and maintainable UI development.
