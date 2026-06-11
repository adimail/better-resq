# **ResQ Real-Time Architecture: Redis Streams & SSE**

## **1. Core Concept: The "Listen-Only" Push Model**
ResQ uses a **Decoupled Push Architecture**:
1.  **PostgreSQL is the source of truth.**
2.  **Redis Streams is the event ledger.** When Go updates Postgres, it writes a "Delta" to a Redis Stream. Streams guarantee message persistence so SSE Hubs can recover from temporary crashes without losing data.
3.  **Go SSE Hubs are the distributors.** They consume Redis Streams via Consumer Groups and fan the message out to connected clients.

---

## **2. Stream Sharding & Geohash Strategy**
Streams are sharded using **Geohashes**. ResQ uses **Precision Level 5** (roughly 4.9km x 4.9km cells).
To solve boundary straddling, the SSE Hub calculates the client's current Level 5 Geohash and automatically subscribes the client to that cell **plus its 8 neighboring cells**.

### **Redis Stream Naming Convention:**
*   **Regional Streams:** `resq:stream:region:<geohash_level_5>`
*   **Targeted User Streams:** `resq:stream:user:<uuid>`
*   **Authority Global Streams:** `resq:stream:admin:global`

---

## **3. The Event Lifecycle (Step-by-Step)**

### **Phase 1: The Mutation (Go API)**
1.  React sends a request to the Go REST API.
2.  Go executes a fast SQL `UPDATE` on the PostgreSQL table.

### **Phase 2: The Stream Append (Go -> Redis)**
1.  Go executes an `XADD` command to append the event payload to the exact geohash stream.

### **Phase 3: The Subscription (Redis -> Go SSE Hub)**
1.  The Go SSE Microservice reads from the stream using `XREADGROUP`.
2.  If the Hub crashes and restarts, it resumes reading from its last acknowledged ID, eliminating the outbox gap present in basic Pub/Sub models.
3.  Upon processing, the Hub issues an `XACK` to mark the message as read.

### **Phase 4: The Fan-Out (Go SSE Hub -> React Clients)**
1.  The Hub holds active network connections.
2.  It enforces a strict limit: Maximum 3 active SSE connections per unique User ID to prevent connection hoarding.
3.  It writes the payload to the specific clients.
4.  To prevent load balancers from killing idle connections, the Hub sends a `\n\n` byte sequence every 15 seconds as a keep-alive heartbeat.

### **Phase 5: The UI Update (React / Zustand)**
1.  The browser receives the SSE message and updates local state. Mapbox GL re-renders without querying the database.

---

## **4. Event Dictionary (The JSON Payloads)**

**1. Danger Zone Active**
```json
{
  "event": "DANGER_ZONE_ACTIVE",
  "data": {
    "zone_id": "dz_999",
    "disaster_type": "FLOOD"
  }
}
```

**2. Camp Stock Changed**
```json
{
  "event": "CAMP_STOCK_UPDATED",
  "data": {
    "camp_id": "rc_456",
    "stock_status": "CRITICAL"
  }
}
```

**3. SOS Acknowledged**
```json
{
  "event": "SOS_ACKNOWLEDGED",
  "data": {
    "sos_id": "sos_789",
    "message": "Rescue Team Alpha dispatched."
  }
}
```

---

## **5. Resilience & Disconnect Strategy**
1.  **Connection Drop:** Phone loses cellular signal.
2.  **Offline State:** PWA shows "Offline" banner.
3.  **Reconnection:** Browser fires the `online` event.
4.  **The Resync:** TanStack Query fires HTTP `GET` requests to fetch the latest state from Postgres, recovering anything missed while disconnected.
5.  **Resume Listening:** Client re-opens the `/v1/stream/events` connection.

