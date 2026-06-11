# **ResQ Database & API Integration Guide**

## **1. `USERS` Table**
**What it does:** Manages identity, roles, and the real-time physical location of everyone in the system.

**Key Data it Holds:**
*   `role`: `CITIZEN`, `AUTHORITY`, `RESPONDER`.
*   `fcm_device_token`: Used for push notifications. Purged automatically if Firebase indicates staleness.
*   `last_known_location`: PostGIS `Point`. Highly sensitive PII, scrubbed after 72 hours of inactivity.

## **2. `REFRESH_TOKENS` Table**
**What it does:** Stores active and revoked refresh tokens for session management and security rotation.

**Key Data it Holds:**
*   `token_hash`: SHA-256 hash of the opaque token string.
*   `user_id`: Foreign key to `USERS`.
*   `expires_at`: Absolute expiration timestamp.
*   `is_revoked`: Boolean flag updated upon logout or security events.

## **3. `SOS_SIGNALS` Table**
**What it does:** Handles life-or-death emergency requests.

**Key Data it Holds:**
*   `citizen_id`: Who is in danger.
*   `location`: Exact PostGIS `Point`.
*   `battery_level`: Crucial context.
*   `status`: `ACTIVE` → `ACKNOWLEDGED` → `RESOLVED`.
*   `responder_id`: The ID of the authority/responder who claimed the ticket.

## **4. `INCIDENT_REPORTS` Table**
**What it does:** Stores raw, crowd-sourced disaster reports.

**Key Data it Holds:**
*   `disaster_type`: `FLOOD`, `FIRE`, etc.
*   `location`: PostGIS `Point`.
*   `status`: `PENDING` → `VERIFIED` → `REJECTED`.
*   `ai_confidence_score`: Untrusted client-side score, used purely as advisory metadata for Authority triage sorting.

## **5. `DANGER_ZONES` Table**
**What it does:** Represents the "Red Polygons" drawn on the live map.

**Key Data it Holds:**
*   `boundary`: A PostGIS `Polygon`.
*   `severity_level`: 1 to 5.
*   `is_active`: Boolean.
*   `expires_at`: Timestamp for auto-cleanup.

## **6. `RESOURCE_CAMPS` Table**
**What it does:** Tracks logistics, shelters, and supply distributions.

**Key Data it Holds:**
*   `camp_type`: `MEDICAL`, `SHELTER`, `FOOD`.
*   `location`: PostGIS `Point`.
*   `stock_status`: `FULLY_STOCKED`, `LOW`, `EMPTY`, `CRITICAL`.

## **7. `GEO_BROADCASTS` Table**
**What it does:** Maintains an immutable audit log of mass emergency push notifications.

**Key Data it Holds:**
*   `authority_id`: Who sent the alert.
*   `target_area`: PostGIS `Polygon`.
*   `message`: Text payload.

