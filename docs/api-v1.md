# **ResQ REST API Specification (v1)**

## **Global API Standards Applied**
*   **Base URL:** `https://api.resq.app/v1`
*   **Content-Type:** `application/json`
*   **Authentication:** `Authorization: Bearer <JWT>`
*   **Pagination:** Cursor-based via `cursor` and `limit` query parameters.
*   **Error Handling:** RFC 7807 Problem Details. Returns `422 Unprocessable Entity` for validation, `409 Conflict` for state issues, `429 Too Many Requests` for rate limiting.
*   **Idempotency:** `POST` endpoints require an `Idempotency-Key` header.
*   **Rate Limiting:** Enforced via Redis.
    *   Public endpoints: 10 req/min per IP.
    *   Authenticated endpoints: 60 req/min per User ID.
    *   Critical endpoints (SOS, Broadcast): Strict 2 req/min.
*   **CORS Policy:** Strictly enforced. Allowed origins: `https://app.resq.app`, `https://admin.resq.app`. No wildcard origins permitted.

---

## **1. Real-Time Streaming (SSE)**

### `GET /v1/stream/events`
Establishes a Server-Sent Events (SSE) connection.
*   **Security:** Bearer Token (Citizen, Authority, Responder).
*   **Limits:** Maximum 3 concurrent open connections per User ID.
*   **Keep-Alive:** Server emits a `\n\n` heartbeat every 15 seconds to prevent load balancer termination.
*   **Headers:** `Accept: text/event-stream`
*   **Query Params:**
    *   `lat`, `lng`, `radius`
*   **Success (200 OK):** Keeps connection open indefinitely.

---

## **2. Authentication & Users**

### `POST /v1/auth/login`
Authenticates a user and returns short-lived access and long-lived refresh tokens.
*   **Security:** Public
*   **Request Body:**
    ```json
    {
      "phone_number": "+1234567890",
      "password": "securepassword123"
    }
    ```
*   **Success (200 OK):**
    ```json
    {
      "access_token": "eyJhb...",
      "refresh_token": "dGhpc...",
      "expires_in": 900
    }
    ```

### `POST /v1/auth/refresh`
Rotates the refresh token and issues a new access token.
*   **Security:** Public (Requires valid Refresh Token in body)
*   **Request Body:**
    ```json
    {
      "refresh_token": "dGhpc..."
    }
    ```
*   **Success (200 OK):** Returns new access and refresh tokens.

### `POST /v1/auth/logout`
Revokes the refresh token and terminates the user session.
*   **Security:** Bearer Token
*   **Request Body:**
    ```json
    {
      "refresh_token": "dGhpc..."
    }
    ```
*   **Success (204 No Content)**

### `PATCH /v1/users/me/device`
Updates the user's current GPS location and FCM token. Must only be called by the client if displacement exceeds 50 meters.
*   **Security:** Bearer Token (Citizen, Authority, Responder)
*   **Request Body:**
    ```json
    {
      "fcm_token": "device_token_xyz",
      "location": {
        "lat": 18.5204,
        "lng": 73.8567
      }
    }
    ```
*   **Success (204 No Content)**

---

## **3. SOS Signals (Critical Path)**

### `POST /v1/sos`
Instantly triggers an emergency alert.
*   **Security:** Bearer Token (Citizen, Responder)
*   **Headers:** `Idempotency-Key: <uuid>`
*   **Request Body:**
    ```json
    {
      "location": {
        "lat": 18.5204,
        "lng": 73.8567
      },
      "battery_level": 15,
      "message": "Trapped on 2nd floor"
    }
    ```
*   **Success (202 Accepted)**

### `GET /v1/sos`
Lists active SOS signals.
*   **Security:** Bearer Token (Authority, Responder)
*   **Query Params:** `status=active`, `bbox=<bounds>`, `limit=100`, `cursor=<uuid>`
*   **Success (200 OK)**

### `PATCH /v1/sos/{id}/status`
Authority or Responder acknowledges or resolves an SOS.
*   **Security:** Bearer Token (Authority, Responder)
*   **Request Body:**
    ```json
    {
      "status": "acknowledged"
    }
    ```
*   **Success (200 OK)**

---

## **4. Incident Reports**

### `POST /v1/uploads/presigned-url`
Generates a temporary Cloudflare R2 upload URL.
*   **Security:** Bearer Token (Citizen, Authority, Responder)
*   **Request Body:**
    ```json
    {
      "content_type": "image/webp",
      "file_size": 102400
    }
    ```
*   **Success (201 Created)**

### `POST /v1/incidents`
Submits a disaster report. The AI confidence score is advisory and treated as untrusted; it is evaluated strictly alongside server-side heuristics.
*   **Security:** Bearer Token (Citizen, Responder)
*   **Request Body:**
    ```json
    {
      "disaster_type": "flood",
      "location": {
        "lat": 18.5204,
        "lng": 73.8567
      },
      "description": "Main street is completely underwater",
      "image_key": "reports/abc.webp",
      "ai_confidence_score": 0.94
    }
    ```
*   **Success (201 Created)**

### `PATCH /v1/incidents/{id}/status`
Authority verifies or rejects a report.
*   **Security:** Bearer Token (Authority)
*   **Request Body:**
    ```json
    {
      "status": "verified"
    }
    ```
*   **Success (200 OK)**

---

## **5. Danger Zones**

### `GET /v1/danger-zones`
Retrieves active danger zones.
*   **Security:** Bearer Token (Citizen, Authority, Responder)
*   **Query Params:** `bbox=<bounds>`
*   **Success (200 OK)**

### `POST /v1/danger-zones`
Manually draw a custom danger zone.
*   **Security:** Bearer Token (Authority)
*   **Request Body:**
    ```json
    {
      "disaster_type": "flood",
      "severity_level": 5,
      "boundary_polygon": [[[73.8, 18.5], [73.9, 18.5]]]
    }
    ```
*   **Success (201 Created)**

---

## **6. Resource Camps**

### `GET /v1/camps`
List all resource camps.
*   **Security:** Bearer Token (Citizen, Authority, Responder)
*   **Query Params:** `bbox`, `type=medical,food`
*   **Success (200 OK)**

### `POST /v1/camps`
Deploy a new camp.
*   **Security:** Bearer Token (Authority)
*   **Request Body:**
    ```json
    {
      "name": "City Hall",
      "camp_type": "shelter",
      "location": {
        "lat": 18.5,
        "lng": 73.8
      }
    }
    ```
*   **Success (201 Created)**

### `PATCH /v1/camps/{id}`
Quick-update for camp inventory.
*   **Security:** Bearer Token (Authority, Responder)
*   **Request Body:**
    ```json
    {
      "stock_status": "critical"
    }
    ```
*   **Success (200 OK)**

---

## **7. Geo-Broadcasts**

### `POST /v1/broadcasts`
Sends a push notification to users within a polygon.
*   **Security:** Bearer Token (Authority)
*   **Request Body:**
    ```json
    {
      "message": "Evacuate North immediately.",
      "severity": "extreme",
      "target_polygon": [[[73.8, 18.5], [73.9, 18.5]]]
    }
    ```
*   **Success (202 Accepted)**

---

## **8. Routing Engine Integration**

### `GET /v1/routes/safe`
Calculates an evacuation route avoiding active Danger Zones.
*   **Security:** Bearer Token (Citizen, Authority, Responder)
*   **Query Params:** `origin=lat,lng`, `destination=lat,lng`, `mode=walking|driving`, `fallback=true`
*   **Success (200 OK):**
    ```json
    {
      "distance_meters": 4500,
      "estimated_minutes": 15,
      "geometry": "encoded_polyline_string",
      "route_compromised": false,
      "turn_by_turn": []
    }
    ```
*   **Fallback Logic:** If all paths intersect danger zones and `fallback=true` is provided, the API returns the path of least resistance with `route_compromised: true`, strictly avoiding Severity 5 zones but allowing intersection with lower severity zones if no other mathematical path exists.

