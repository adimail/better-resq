# **ResQ System Architecture & Engineering Standards**

## **1. Executive Summary**
The ResQ platform is architected as a **Strict Modular Monolith (Go)** serving a **Frontend Monorepo (React/Vite)**. It relies on an event-driven state propagation model (Redis Streams + SSE) and geospatial source-of-truth (PostGIS).

---

## **2. System Topology & Data Flow**

### **2.1 Interaction Model: CQRS (Light) & Event-Driven Push**
1.  **Commands (Synchronous):** React client sends a request to Go. Go applies domain logic, commits to PostgreSQL, and returns `200 OK`.
2.  **State Propagation (Asynchronous):** Upon commit, Go writes a domain event to Redis Streams. The Go SSE Hub consumes the stream via a consumer group and streams the delta to passive React clients.
3.  **Queries (Passive):** React clients fetch initial state via HTTP `GET`, then passively listen to the SSE stream via TanStack Query.

---

## **3. Backend Architecture: Go Modular Monolith**

### **3.1 Bounded Contexts (Modules)**
*   `identity`: User auth, Token rotation, RBAC, FCM token management.
*   `incidents`: Disaster reports, Danger Zone clustering.
*   `logistics`: Resource camps, stock levels.
*   `emergency`: SOS signals, responder dispatch, Geo-broadcasts.

### **3.2 Enforced Directory Structure**
```text
/backend
├── cmd/
│   └── resq-server/
├── internal/
│   ├── shared/
│   ├── identity/
│   ├── logistics/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── transport/
│   │   └── repository/
│   └── emergency/
├── pkg/
└── sql/
    ├── migrations/
    └── queries/
```

---

## **4. Frontend Architecture: React Monorepo**

### **4.1 Enforced Directory Structure**
```text
/frontend
├── apps/
│   ├── citizen-pwa/
│   └── admin-portal/
├── packages/
│   ├── ui-kit/
│   ├── api-client/
│   └── types/
```

### **4.2 State Management Delineation**
*   **Server State (TanStack Query):** Owns database state. Handles background refetching and offline mutations.
*   **Client State (Zustand):** Owns ephemeral UI state.
*   **Form State (TanStack Form):** Manages complex wizard forms.

---

## **5. Critical Safety & Resilience Patterns**

### **5.1 The Transactional Outbox Pattern & Feedback Loop**
*   **Implementation:** When an SOS or Mass Broadcast is created, an event is inserted into a Postgres `outbox` table within the same transaction. A background worker polls the `outbox` and interacts with Firebase/Twilio.
*   **FCM Invalidation Loop:** Firebase API responses are parsed for delivery failures. If an FCM token returns `UNREGISTERED` or `INVALID_ARGUMENT`, the worker instantly deletes the token from the `USERS` table to prevent silent failures on future broadcasts.

### **5.2 Idempotency at the Edge**
Every `POST` request must include an `Idempotency-Key`. The backend stores this key to ensure EXACTLY-ONCE processing.

### **5.3 PWA "Store and Forward"**
Offline mutations are persisted to `IndexedDB` and flushed automatically when `navigator.onLine` becomes true.

---

## **6. Observability & DR Plan**

*   **Statelessness:** The Go backend is strictly stateless.
*   **Database HA:** PostgreSQL runs in a multi-AZ cluster with a hot standby. The RPO is 1 minute, and RTO is under 5 minutes.
*   **PostGIS Protection:** Input spatial polygons must be sanitized and simplified via `ST_SimplifyPreserveTopology` before complex intersection logic to prevent CPU exhaustion.

---

## **7. Security & Threat Model**

### **7.1 Role-Based Access Control (RBAC) Matrix**
The API gateway strictly evaluates the JWT payload `role` claim against the following matrix:
*   **CITIZEN:** Can create SOS, create incidents, view map states. Cannot modify camps or acknowledge SOS.
*   **RESPONDER:** Can acknowledge SOS, update camp stock, view map states. Cannot trigger geo-broadcasts or verify reports.
*   **AUTHORITY:** Full system access. Can verify reports, create danger zones, and trigger massive geo-broadcasts.

### **7.2 Token Management**
Access tokens are stateless JWTs expiring in 15 minutes. Refresh tokens are opaque strings stored in the `REFRESH_TOKENS` table and rotated on every use to prevent replay attacks.

### **7.3 Data Privacy & Retention**
The `last_known_location` in the `USERS` table is highly sensitive PII.
*   It is strictly overwritten, maintaining no historical path track.
*   It is automatically scrubbed to `NULL` if the user has not opened the app in 72 hours.
*   Authority maps view citizen locations as anonymized density heatmaps via PostGIS `ST_ClusterKMeans`, never as individual identifiable markers.

---

## **8. OpenAPI & Load Testing**

*   **Source of Truth:** A comprehensive `openapi.yaml` file resides in the root `/docs` directory. The frontend monorepo automatically generates the Axios API client interfaces from this specification.
*   **Load Testing:** The system is benchmarked via K6 to ensure an SOS payload is committed and acknowledged within a P99 latency of 500ms under a load of 10,000 requests per second.

