# AODF: Portal Service

## 1. Overview
The Portal service acts as the primary API gateway and WebSocket hub for the Relica system. It authenticates requests (JWT), routes them to appropriate backend services (Archivist, Clarity, Aperture), and manages WebSocket connections for real-time communication.

## 2. Structure
- **Core Namespace:** `io.relica.portal.core`
- **Key Modules:**
    - `io.relica.portal.handlers.http`: Handles incoming HTTP requests.
    - `io.relica.portal.handlers.websocket`: Manages WebSocket connections and message routing.
    - `io.relica.portal.io.client_instances`: Manages connections to backend services.
    - `io.relica.portal.auth`: Handles authentication (JWT).
- **Configuration:** `io.relica.portal.config`

## 3. Operations / Routes
- **HTTP API (`/api/v1/...`):** Proxies requests to backend REST APIs.
    - `/api/v1/auth/login`: User authentication.
    - `/api/v1/data/...`: Routes to Archivist.
    - `/api/v1/insights/...`: Routes to Clarity.
    - `/api/v1/viz/...`: Routes to Aperture.
- **WebSocket Endpoint (`/ws`):** Handles real-time bidirectional communication, routing messages between clients and backend services (Clarity, Archivist).

## 4. Relationships
- **Depends on:** `io.relica.common`
- **Connects to:** `io.relica.archivist`, `io.relica.clarity`, `io.relica.aperture`
- **Used by:** Frontend clients, external API consumers.

## 5. Security
- **Authentication:** All API routes (except login/public) and WebSocket connections are secured using JSON Web Tokens (JWT).

## 6. Environment Variables
- `PORTAL_PORT`: Port the service listens on (e.g., 8080).
- `JWT_SECRET`: Secret key for signing and verifying JWTs.
- `ARCHIVIST_WS_URL`/`ARCHIVIST_API_URL`: URLs for Archivist service.
- `CLARITY_WS_URL`/`CLARITY_API_URL`: URLs for Clarity service.
- `APERTURE_API_URL`: URL for Aperture service.

## 7. Deployment
Deployed as the main entry point service, typically containerized and exposed via an ingress controller or load balancer.

## 8. Troubleshooting
- Verify JWT secret configuration.
- Check connectivity to all backend services (Archivist, Clarity, Aperture).
- Inspect logs for routing errors or authentication failures.
- Monitor WebSocket connection stability and message flow.