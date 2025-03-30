# AODF: Shutter Service

## 1. Overview
The Shutter service is responsible for user authentication and session management within the Relica ecosystem. It handles user login via credentials, issues JSON Web Tokens (JWT), and validates these tokens for securing access to other services.

## 2. Structure
- **Core Namespace:** `io.relica.shutter.core`
- **Framework:** Built using the Pedestal web framework.
- **Key Libraries:** `buddy/buddy-auth`, `buddy/buddy-hashers`, `buddy.sign.jwt` for authentication and JWT handling; `next.jdbc` for PostgreSQL interaction.
- **Database:** Interacts with a PostgreSQL database, primarily the `users` table.

## 3. Operations / API Endpoints
- **`GET /health`**: Checks service health, including database connectivity.
- **`POST /api/login`**: Authenticates a user based on email and password provided in the request body. Returns a JWT and basic user info upon success.
- **`POST /api/validate`**: Validates a provided JWT (sent in the Authorization header). Returns success status and token claims if valid.
- **`GET /auth/profile`**: Requires a valid JWT. Returns basic user profile information (e.g., user ID, email) extracted from the validated token.

## 4. Relationships
- **Depends on:** `io.relica.common` (likely for shared utilities, though not explicitly seen in core), PostgreSQL database.
- **Used by:** Services requiring user authentication, such as `io.relica.portal` (API Gateway) or any service needing to protect endpoints.

## 5. Environment Variables
- **`POSTGRES_DB`**: Name of the PostgreSQL database.
- **`POSTGRES_HOST`**: Hostname/IP of the PostgreSQL server.
- **`POSTGRES_USER`**: Username for PostgreSQL connection.
- **`POSTGRES_PASSWORD`**: Password for PostgreSQL connection.
- **`POSTGRES_PORT`**: Port for PostgreSQL connection (default 5432).
- **`JWT_SECRET`**: Secret key used for signing and validating JWTs.
- **`PORT`**: Port the Shutter service listens on (default 2173).

## 6. Deployment
Deployed as a standalone, containerized web service. Requires a running PostgreSQL instance and a configured JWT secret.

## 7. Troubleshooting
- Verify database connection details and reachability.
- Ensure the `JWT_SECRET` environment variable matches the one used by consuming services for validation.
- Check logs (`io.relica.shutter.core`) for authentication errors, database issues, or token validation failures.
- Confirm user credentials and `is_active` status in the `users` table.
