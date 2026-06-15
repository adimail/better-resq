# ResQ Backend (Go)

A modular monolith designed for sub-500ms latency under high load.

## Core Features
- **Geospatial Engine**: PostGIS logic for SOS-to-Responder proximity and Danger Zone intersections.
- **Safe Routing**: Valhalla integration for calculating escape routes that dynamically exclude hazardous PostGIS polygons.
- **Real-time Engine**: Redis Streams fan-out to SSE Hub for live map updates.
- **Identity**: JWT with secure Refresh Token rotation and RBAC.
- **Resilience**: Transactional Outbox pattern for emergency notifications.

## Dependencies
- **Gin**: HTTP framework.
- **Pgx**: High-performance PostgreSQL driver.
- **Goose**: Migration management.
- **SQLC**: Type-safe SQL generator.
- **Redis**: Event ledger and rate limiting.
- **Valhalla**: Open-source routing engine for dynamic hazard avoidance.

## Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | Server port |
| `DATABASE_URL` | postgres://... | PostGIS connection string |
| `REDIS_URL` | redis://... | Redis connection string |
| `VALHALLA_URL` | http://localhost:8002 | Valhalla routing engine URL |
| `JWT_SECRET` | super-secret | HMAC signing key |
| `GIN_MODE` | debug | debug or release |

## Available Modules
- `identity`: Authentication, registration, and user profiles.
- `emergency`: SOS lifecycle, geo-broadcasts, and Valhalla-powered safe routing.
- `incidents`: Crowd-sourced reports and danger zone drawing.
- `logistics`: Resource camp management and inventory.
- `notifications`: User-specific alert history.
- `weather`: Localized climate metrics.

## Make Commands
- `make dev-api`: Runs the Go server with auto-loading.
- `make db-up`: Applies PostGIS migrations.
- `make sqlc`: Generates type-safe Go code from SQL queries.

