# Vehicle Rental Management Backend

A small REST API for a vehicle rental company. Staff log in with JWT and manage the vehicle fleet; customer bookings are recorded as rentals. A vehicle cannot be double-booked for overlapping dates, and monthly rental activity is reported per vehicle.

## Features

- JWT-based authentication for staff (`POST /auth/login`)
- Vehicle CRUD with soft delete and photo upload (multipart)
- Rental booking with server-side `total_amount` calculation
- **Double-booking protection** — create and update both reject date overlaps (HTTP 409) in a DB-transaction with row locking (race-safe)
- Monthly rental report per vehicle (days/revenue prorated to the requested month)
- Pagination and filtering on listings
- Rate-limited login endpoint
- Joi input validation, structured error responses

## Tech Stack

- [Node.js](https://nodejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- [Express](https://expressjs.com/)
- [Knex](https://knexjs.org/) query builder
- [PostgreSQL](https://www.postgresql.org/) (`pg` driver)
- [Joi](https://joi.dev/) validation
- [Multer](https://github.com/expressjs/multer) file upload
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- ESLint + Prettier

## Prerequisites

- Node.js 18+
- PostgreSQL 12+ running locally
- npm

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Create the database
psql -U postgres -c "CREATE DATABASE vehicle_rental;"

# 3. Configure environment
cp .env.example .env
#   then edit .env with your DB credentials, JWT secret, etc.
```

## Configuration

All configuration comes from environment variables (see `.env.example`):

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | `development` / `production` | `development` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgres` |
| `DB_NAME` | Database name | `vehicle_rental` |
| `DB_POOL_MIN` | Connection pool minimum | `2` |
| `DB_POOL_MAX` | Connection pool maximum | `10` |
| `JWT_SECRET` | Secret used to sign JWTs | `change_me_...` |
| `JWT_EXPIRES_IN` | JWT expiry (e.g. `7d`) | `7d` |
| `UPLOAD_PATH` | Local photo upload directory | `uploads` |
| `UPLOAD_MAX_SIZE_MB` | Max uploaded file size in MB | `5` |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | Login rate-limit window (ms) | `900000` |
| `LOGIN_RATE_LIMIT_MAX` | Max login attempts per window | `10` |

`.env` is gitignored. A template is committed as `.env.example`.

## Database Setup

Apply the migrations and load the seed data:

```bash
npm run migrate:latest   # creates staff, vehicles, rentals tables
npm run db:seed          # inserts test data
```

The seed inserts:

- **Staff:** `admin@example.com` / `admin123`
- **Vehicles:** Toyota Camry (Sedan, 2500/day), Toyota Land Cruiser (SUV, 6000/day), Toyota Hiace (Van, 4500/day)
- **Rentals:** 4 bookings, including one that spans a month boundary (Jul 29 – Aug 3) so the monthly report is testable

## Running

```bash
# Development (hot reload)
npm run dev

# Production build
npm run build
npm start
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run with ts-node-dev (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled app |
| `npm run lint` / `lint:fix` | ESLint check / autofix |
| `npm run format` | Prettier formatting |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm run migrate:make` | Create a new migration |
| `npm run migrate:latest` | Run pending migrations |
| `npm run migrate:rollback` | Roll back the last batch |
| `npm run db:seed` | Run seeds (wipes + reloads test data) |

## API Reference

Base URL: `http://localhost:5000/api/v1`

All routes except `POST /auth/login` require an `Authorization: Bearer <token>` header. The token is obtained from `/auth/login`.

### Auth

#### `POST /auth/login`

Authenticates a staff member and returns a JWT.

Request body:

```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "<jwt>",
    "staff": {
      "id": 1,
      "email": "admin@example.com",
      "name": "System Admin"
    }
  }
}
```

Errors: `401` invalid credentials, `429` too many attempts (rate limited).

### Vehicles

#### `GET /vehicles`

List vehicles with pagination and filters.

Query params:

| Param | Description |
| --- | --- |
| `page` | Page number (default `1`) |
| `limit` | Items per page (max `100`, default `10`) |
| `sortBy` | Sort column (e.g. `name`, `daily_rate`) |
| `sortOrder` | `asc` / `desc` |
| `category` | Filter by category |
| `search` | Fuzzy search on name |

Response `200` includes `meta` (page, limit, total, totalPages) and a `data` array.

#### `GET /vehicles/:id`

Returns a single vehicle. `404` if not found or soft-deleted.

#### `POST /vehicles`

Creates a vehicle. `Content-Type: multipart/form-data`.

Form fields:

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | required |
| `plate_number` | string | required, unique |
| `category` | string | required |
| `daily_rate` | number | required, positive |
| `photo` | file | optional image (jpeg/png/webp/gif) |

Response `201` with the created vehicle (includes `photo_url`).

#### `PUT /vehicles/:id`

Updates a vehicle. Same multipart form. Omit fields you don't want to change; upload a new `photo` to replace the existing one (the old file is deleted).

#### `DELETE /vehicles/:id`

Soft deletes the vehicle (`deleted_at` is set; the row stays in the DB). `200` on success.

### Rentals

#### `GET /rentals`

List rentals with filters and pagination.

Query params:

| Param | Description |
| --- | --- |
| `vehicle_id` | Filter by vehicle |
| `status` | `booked` / `ongoing` / `completed` / `cancelled` |
| `from` | Only rentals active on/after this date (`YYYY-MM-DD`) |
| `to` | Only rentals active on/before this date (`YYYY-MM-DD`) |
| `page`, `limit`, `sortBy`, `sortOrder` | Pagination / sorting |

#### `GET /rentals/:id`

Returns a single rental. `404` if not found.

#### `POST /rentals`

Creates a rental. `total_amount` is calculated server-side as `daily_rate × number of days` (a same-day booking counts as 1 day).

Request body:

```json
{
  "vehicle_id": 1,
  "customer_name": "Rahim Uddin",
  "customer_phone": "01700000001",
  "start_date": "2026-08-20",
  "end_date": "2026-08-22"
}
```

Response `201` with the created rental (`status` defaults to `booked`).

**`409`** if the vehicle already has an active (`booked` or `ongoing`) rental whose date range overlaps the requested dates. `404` if the vehicle does not exist or was soft-deleted.

#### `PUT /rentals/:id`

Updates a rental. Changing `vehicle_id`, `start_date`, or `end_date` re-triggers the overlap check (rejects with `409` on conflict); reactivating a `cancelled`/`completed` rental back to an active status is also re-checked. `total_amount` is recalculated when dates/vehicle change.

#### `DELETE /rentals/:id`

Permanently deletes the rental. `200` on success.

### Reports

#### `GET /reports/rentals?month=YYYY-MM&vehicle_id=`

Monthly rental activity per vehicle.

Query params:

| Param | Description |
| --- | --- |
| `month` | required, `YYYY-MM`, e.g. `2026-08` |
| `vehicle_id` | optional, restrict the report to one vehicle |

Response `200`:

```json
{
  "success": true,
  "message": "Monthly rental report generated successfully.",
  "data": {
    "vehicles": [
      {
        "id": 1,
        "name": "Toyota Land Cruiser",
        "total_bookings": 1,
        "days_rented": 5,
        "revenue": 30000
      }
    ],
    "topVehicle": {
      "id": 1,
      "name": "Toyota Land Cruiser",
      "total_bookings": 1,
      "days_rented": 5,
      "revenue": 30000
    }
  }
}
```

Notes:

- Only days that fall inside the requested month are counted — e.g. a rental running Jul 29 – Aug 3 contributes **3 days** to the August report, not 6. Revenue is prorated the same way (`daily_rate × days_in_month`).
- `cancelled` rentals are excluded.
- `topVehicle` is the vehicle with the highest revenue that month (first by revenue desc).

## Database Schema

**staff**

| Column | Type | Notes |
| --- | --- | --- |
| id | integer (PK, auto) | |
| email | varchar(255) | unique, required |
| password_hash | varchar(255) | required |
| name | varchar(255) | required |
| created_at / updated_at | timestamptz | |

**vehicles**

| Column | Type | Notes |
| --- | --- | --- |
| id | integer (PK, auto) | |
| name | varchar(255) | required |
| plate_number | varchar(50) | unique, required |
| category | varchar(100) | required |
| daily_rate | decimal(10,2) | required |
| photo_path | varchar(500) | nullable |
| deleted_at | timestamptz | nullable (soft delete) |
| created_at / updated_at | timestamptz | |

**rentals**

| Column | Type | Notes |
| --- | --- | --- |
| id | integer (PK, auto) | |
| vehicle_id | integer (FK → vehicles.id) | required, ON DELETE CASCADE |
| customer_name | varchar(255) | required |
| customer_phone | varchar(50) | required |
| start_date | date | required |
| end_date | date | required |
| total_amount | decimal(12,2) | required |
| status | enum | `booked` (default) / `ongoing` / `completed` / `cancelled` |
| created_at / updated_at | timestamptz | |

## Behavior Notes

- **Overlap rule:** no column constraint prevents double-booking. Two rentals conflict only if their date ranges overlap and both have an *active* status (`booked` or `ongoing`). The check is enforced in the application code on both create and update, inside a transaction that locks the vehicle row, so two simultaneous bookings cannot both succeed.
- **Soft delete:** `DELETE /vehicles/:id` sets `deleted_at`; deleted vehicles are excluded from all vehicle queries and cannot be rented.
- **Uploads:** photos are stored locally under `UPLOAD_PATH` (default `uploads/`, gitignored) and served at `/uploads/<filename>`. Only jpeg/png/webp/gif are accepted.
- **Errors:** consistent shape — `{ success, message, statusCode }`, plus `details` for validation and `stack` in development.

## Example API Calls

Login and list vehicles (PowerShell):

```powershell
$login = Invoke-RestMethod -Uri 'http://localhost:5000/api/v1/auth/login' -Method Post `
  -ContentType 'application/json' -Body '{"email":"admin@example.com","password":"admin123"}'
$token = $login.data.accessToken
$headers = @{ Authorization = "Bearer $token" }

(Invoke-RestMethod -Uri 'http://localhost:5000/api/v1/vehicles' -Headers $headers).data
```

Login and list vehicles (curl):

```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq -r '.data.accessToken')

curl -s http://localhost:5000/api/v1/vehicles -H "Authorization: Bearer $TOKEN"
```

Create a rental and fetch the monthly report:

```bash
# 1. create (Camry = 2500/day, 3 days -> total_amount 7500.00)
curl -s -X POST http://localhost:5000/api/v1/rentals -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"vehicle_id":1,"customer_name":"Rahim Uddin","customer_phone":"01700000001","start_date":"2026-08-20","end_date":"2026-08-22"}'

# 2. monthly report
curl -s "http://localhost:5000/api/v1/reports/rentals?month=2026-08" -H "Authorization: Bearer $TOKEN"
```