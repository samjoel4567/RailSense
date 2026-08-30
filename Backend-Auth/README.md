# RAIL//AI — Operator Authentication Backend

Production-ready Node.js + Express + MongoDB microservice for operator authentication and role-based access control.

## Architecture

```
React Frontend (Vite)
        ↓  (Bearer JWT)
Express API Router (/api/auth)
        ↓
Auth Middleware (JWT Verify & Role Check)
        ↓
Mongoose ODM (Bcrypt password hashing)
        ↓
MongoDB Database
```

## Quick Start

1. **Install dependencies**:
   ```bash
   cd Backend-Auth
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```

3. **Start the server**:
   ```bash
   npm run dev
   ```

The authentication server will boot at `http://localhost:5001`.

## Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register new operator account | No |
| `POST` | `/api/auth/login` | Authenticate operator credentials | No |
| `POST` | `/api/auth/logout` | Invalidate operator session | No |
| `GET` | `/api/auth/me` | Fetch active operator profile | Yes (Bearer Token) |
| `GET` | `/api/health` | Service health status check | No |


## Operator Roles

- `LOCO_PILOT` — Cab signaling & speed ceiling enforcement (`/loco-pilot`, `/simulator`)
- `STATION_MASTER` — Platform interlocking & route clearing (`/station-master`, `/simulator`)
- `CONTROL_ROOM` — Network-wide dispatching & intrusion response (`/control-room`, `/simulator`)
- `ADMIN` — Universal administrative clearance across all consoles
