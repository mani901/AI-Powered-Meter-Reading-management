# SmartMeter Backend

Express + TypeScript + Prisma/PostgreSQL backend for the SmartMeter frontend.

## Requirements

- Node.js (LTS recommended)
- PostgreSQL running locally (or a hosted connection string)

## Setup

1. Create `.env` (or edit the existing one):

- Use `.env.example` as reference.
- Set real values for `GEMINI_API_KEY`, Cloudinary keys, and SMTP credentials.

2. Install dependencies:

```bash
cd Backend
npm install
```

3. Generate Prisma client + migrate DB:

```bash
npm run db:generate
npx prisma migrate dev --name init
```

4. Seed demo data (matches frontend mock users):

```bash
npm run db:seed
```

## Run

```bash
npm run dev
```

Server defaults to `http://localhost:3000`.

## Demo logins

- **Admin**: `admin@smartmeter.com` / `Admin@123`
- **Consumer**: `user@test.com` / `User@123`

## Key endpoints (high-level)

- `POST /api/auth/login`
- `POST /api/auth/refresh` (uses httpOnly cookie `sm_refresh`)
- `GET /api/users/me`
- `GET /api/meters`
- `POST /api/readings/upload` (multipart: `image`, body: `meterId`)
- `POST /api/readings`
- `GET /api/bills`
- `GET /api/notifications/unread-count`

## Tests

```bash
npm test
```

