# ResQ | Emergency Coordination Platform

ResQ is a high-performance, resilient platform designed for real-time disaster response and emergency coordination. It facilitates life-saving communication between citizens, first responders, and government authorities during critical events.

## System Architecture

### 1. Backend: Modular Monolith (Go)
The backend is built as a **Strict Modular Monolith** in Go. This allows for clear domain separation while maintaining deployment simplicity.
- **Geospatial Logic**: Uses **PostGIS** for high-precision spatial queries (e.g., "Is this user inside a flood zone?").
- **Routing Engine**: Integrates a self-hosted **Valhalla** instance to calculate dynamic escape routes that mathematically avoid intersecting with active hazard polygons.
- **State Propagation**: Employs **Redis Streams** as an event ledger. When data changes in Postgres, a delta is written to Redis.
- **Real-time Sync**: A specialized **SSE (Server-Sent Events) Hub** consumes Redis Streams and pushes updates to connected clients without polling.

### 2. Frontend: Monorepo (Bun Workspaces)
The frontend uses a modern monorepo structure to share code between the Citizen PWA and the Admin Portal.
- **Shared Packages**:
    - `@resq/ui-kit`: A standardized design system (Tailwind + Lucide).
    - `@resq/api-client`: Centralized Axios instance with auto-refreshing JWTs.
    - `@resq/types`: Shared TypeScript models and API schemas.
- **State Management**: **TanStack Query** handles server-state with background synchronization, while **Zustand** manages ephemeral UI state.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Go 1.25, Gin, SQLC, pgx/v5 |
| **Frontend** | React 19, Vite 8, Bun, Tailwind CSS |
| **Data & Routing** | PostgreSQL 16, PostGIS 3.4, Valhalla |
| **Real-time** | Redis 7 (Streams), SSE |
| **DevOps** | Docker Compose, GitHub Actions (CI) |

---

## Project Structure

```text
├── backend/                # Go Modular Monolith
│   ├── cmd/                # Entry point
│   ├── internal/           # Bounded contexts (identity, emergency, etc.)
│   ├── pkg/                # Shared Go utilities
│   └── sql/                # Migrations and Raw SQL queries
├── frontend/               # Bun Monorepo
│   ├── apps/
│   │   ├── citizen-pwa/    # Mobile-first app for civilians
│   │   └── admin-portal/   # Desktop-first command center
│   └── packages/
│       ├── ui-kit/         # Design system
│       ├── api-client/     # API logic
│       └── types/          # TS definitions
├── docs/                   # API & Architecture documentation
└── scripts/                # Infrastructure & Seeding scripts
```

---

## Getting Started

### 1. Infrastructure Setup
Ensure Docker is running and launch the core services:
```bash
make services-up
```

### 2. Dependency Installation
Install Go tools and Bun dependencies:
```bash
make setup
```

### 3. Database Initialization
Run PostGIS migrations and seed the database with initial data (Admin user, dummy hazards):
```bash
make db-up
make db-seed
```

### 4. Running the Platform
Start the API and both Frontend applications in development mode:
```bash
make dev
```
- **API**: `http://localhost:8080`
- **Citizen PWA**: `http://localhost:3000`
- **Admin Portal**: `http://localhost:3001`

---

## Key Features

- **SOS Lifecycle**: 3-second long-press trigger with battery monitoring and responder acknowledgement.
- **Safe Evacuation**: Real-time, turn-by-turn routing (Walking & Driving modes) powered by Valhalla, dynamically calculating paths that completely avoid active "Danger Zone" polygons based on severity levels.
- **Geo-Broadcasts**: Authority-driven push notifications targeted at users physically inside a specific map area.
- **Offline Resilience**: "Store and Forward" mechanism for incident reports; data flushes automatically when signal returns.

