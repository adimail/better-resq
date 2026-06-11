# **ResQ Tech Stack Overview**

### **1. Frontend Layer (Citizen PWA & Admin Portal)**
*   **React 18+:** The core UI library used for building both the mobile-first Citizen App and the desktop-first Admin Command Center.
*   **Vite:** The build tool and development server, providing lightning-fast Hot Module Replacement (HMR) and highly optimized production bundles.
*   **TanStack Query (React Query):** Handles all asynchronous state, API fetching, caching, and crucial "Store & Forward" offline mutation queues.
*   **TanStack Table:** A headless UI utility used in the Admin Portal to build highly performant, sortable, and filterable data grids for triage and logistics.
*   **TanStack Form:** Manages complex form state and validation (e.g., the multi-step incident reporting wizard and admin broadcast tools) with zero unnecessary re-renders.
*   **Zustand:** A tiny, unopinionated state manager used for global UI states (e.g., toggling dark mode, opening/closing bottom-sheet drawers).
*   **Tailwind CSS:** Utility-first CSS framework for rapidly building custom, responsive designs without writing raw CSS files.
*   **Heroicons:** The exclusive SVG icon library, ensuring high visual clarity and zero render-blocking web font downloads.
*   **MapLibre GL JS:** An open-source vector map library used to render fast, low-bandwidth maps and hardware-accelerated danger zone polygons.
*   **TensorFlow.js:** Runs the lightweight MobileNetV2 CNN directly in the browser to validate disaster images on the user's device before consuming upload bandwidth.

### **2. Backend Layer (API & Streaming)**
*   **Go (Golang):** The primary backend language, chosen for its compiled speed, low memory footprint, and ability to handle thousands of concurrent connections effortlessly.
*   **Gin:** A high-performance HTTP web framework for Go, used to route REST API requests, manage CORS, and handle middleware (like JWT verification).
*   **Server-Sent Events (SSE) via Go:** Utilizing native Goroutines to hold open lightweight, one-way HTTP connections to push live map updates to thousands of React clients.
*   **SQLC:** A SQL compiler for Go. Instead of a heavy ORM, developers write raw, optimized SQL (and PostGIS queries), and `sqlc` automatically generates type-safe Go code to interact with the database.

### **3. Database & Geospatial Layer**
*   **PostgreSQL:** The primary relational database handling all persistent state (users, reports, camps).
*   **PostGIS:** The geospatial extension for PostgreSQL. Enables lightning-fast, mathematically precise spatial queries (e.g., finding users inside a drawn polygon, measuring distances in meters).

### **4. Real-Time & Caching Layer**
*   **Redis:** Serves two critical functions:
    1.  **Pub/Sub Broker:** When Go updates the database, it publishes a message to Redis, which instantly fans out the alert to all connected SSE Go nodes.
    2.  **Hot-State Cache:** Caches the current active "Danger Zones" and "Camp Stocks" so connecting clients don't hammer the Postgres database upon app load.

### **5. Storage & Media Assets**
*   **Cloudflare R2:** An S3-compatible object storage service with zero egress fees, used to permanently store user-uploaded disaster photos.
*   **Browser Canvas API:** Used on the frontend to resize and compress user photos into the `WebP` format *before* they are sent over the cellular network.

---

### **6. Deployment Options**

To ensure 99.99% uptime during regional disasters, the infrastructure must be highly available and decoupled.

**Frontend (Static Hosting / Edge):**
*   **Vercel / Cloudflare Pages / Netlify:** Ideal for hosting the React PWA. These platforms push the static HTML/JS/CSS assets to Edge nodes globally, ensuring the app shell loads instantly for users anywhere in the world.

**Backend (Containerized Compute):**
*   **Google Cloud Run / AWS ECS (Fargate):** Serverless container environments. If an earthquake hits and traffic spikes from 100 to 50,000 users, these platforms automatically spin up hundreds of Go/Gin containers in seconds, and scale back down to zero when the disaster passes.
*   **Render / Railway:** Excellent alternatives for faster developer setup, offering managed Docker deployments with built-in auto-scaling.

**Database & Redis (Managed Services):**
*   **Supabase / Neon / AWS RDS:** Managed PostgreSQL providers. Supabase and Neon are highly recommended as they come with PostGIS pre-installed and offer connection pooling (PgBouncer) out of the box.
*   **Upstash / AWS ElastiCache:** Managed Redis providers. Upstash is serverless (you pay per request), making it incredibly cost-effective for disaster apps that sit idle for months and then experience massive traffic spikes.
