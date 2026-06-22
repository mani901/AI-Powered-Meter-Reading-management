<div align="center">

# ⚡ AI-Powered Meter Reading Management System

**Automate utility meter reading with computer vision, streamline billing, and manage field operations all in one platform.**

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-7.0-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

[Features](#-features) · [Architecture](#-architecture) · [Tech Stack](#-tech-stack) · [Quick Start](#-quick-start) · [API Reference](#-api-reference) · [AI Model](#-ai-model)

</div>

---

## Overview

This is a **full-stack utility meter management platform** built as a Final Year Project. It uses **YOLO-based computer vision** to automatically extract readings from meter images, eliminating manual data entry errors. The system supports the complete lifecycle from field staff uploading meter photos, through automated AI extraction, to bill generation and dispute resolution across three distinct user roles.

> Built with a React + Tailwind frontend, an Express + TypeScript REST API, a PostgreSQL database via Prisma ORM, and a Python FastAPI microservice serving two custom-trained YOLO models.

---

## Features

### AI-Powered Reading Extraction
- Dual-YOLO pipeline: one model detects the meter display ROI, a second extracts individual digits
- 8-variant image enhancement (CLAHE, bilateral filtering, gamma correction, morphology) with confidence scoring across all variants
- Decimal point auto-insertion based on digit count
- Source tracking: `AI_EXTRACTED`, `AI_CORRECTED`, or `MANUAL`
- Confidence threshold enforcement low-confidence readings are flagged for manual review

### Meter & Reading Management
- Register analog and digital meters with approval workflow
- Meter status lifecycle: `PENDING → ACTIVE → INACTIVE / FAULTY / REJECTED`
- Anomaly detection flags unusual consumption spikes automatically
- Reading status workflow: `PENDING_REVIEW → ACCEPTED / FLAGGED / REJECTED`

### Automated Billing Engine
- Tiered tariff slabs with effective date support
- Monthly bill auto-generation via cron job (1st of each month, 03:00)
- Bill breakdown: energy charges, fixed charges, fuel adjustments, and tax
- Bill status lifecycle: `ESTIMATED → CONFIRMED → PAID / OVERDUE`
- Overdue detection runs nightly at 02:00

### Role-Based Access Control
| Role | Capabilities |
|------|-------------|
| **Admin** | Full system control — users, meters, tariffs, billing, disputes, analytics |
| **Field Staff** | View assigned meters, submit readings (AI or manual), track submissions |
| **Consumer** | View own meter, readings, bills, raise and track disputes |

### Dispute Resolution
- Consumers raise disputes linked to specific bills
- Admin review workflow with status tracking: `OPEN → UNDER_REVIEW → RESOLVED / REJECTED`

### Notifications & Alerts
- 10 notification types including reading reminders, abnormal usage alerts, billing generated, and low-confidence warnings
- Scheduled daily reading reminders (08:00 cron)
- Per-user notification preferences

### Security & Observability
- JWT access + refresh token authentication with hourly token cleanup
- Helmet + express-rate-limit for API hardening
- Complete audit log for every user action
- Structured JSON logging with Pino

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      CLIENT BROWSER                          │
│              React 18 + Vite + Tailwind CSS                  │
│         (TanStack Query · React Hook Form · Zustand)         │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST (JSON)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   BACKEND API SERVER                         │
│            Express 5 + TypeScript (Node.js)                  │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────────┐ │
│  │  Auth / JWT │ │ Rate Limiter │ │   Validation (Zod)    │ │
│  └─────────────┘ └──────────────┘ └───────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Routes: auth · users · meters · readings · bills     │    │
│  │         tariffs · disputes · notifications ·          │    │
│  │         analytics · admin · staff · export           │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────────┐ │
│  │  Prisma ORM │ │  Cloudinary  │ │   Nodemailer (SMTP)   │ │
│  └──────┬──────┘ └──────────────┘ └───────────────────────┘ │
│         │                  │ HTTP                            │
└─────────┼──────────────────┼─────────────────────────────────┘
          │                  ▼
          │   ┌──────────────────────────────────┐
          │   │       AI MICROSERVICE            │
          │   │    FastAPI + Uvicorn (Python)     │
          │   │  ┌────────────────────────────┐  │
          │   │  │  meter_roi_best.pt (YOLO)  │  │
          │   │  │  → Detect meter display    │  │
          │   │  ├────────────────────────────┤  │
          │   │  │  best.pt (YOLO)            │  │
          │   │  │  → Extract digit sequence  │  │
          │   │  ├────────────────────────────┤  │
          │   │  │  8-Variant CLAHE Pipeline  │  │
          │   │  │  → Confidence scoring      │  │
          │   │  └────────────────────────────┘  │
          │   └──────────────────────────────────┘
          ▼
┌──────────────────┐
│   PostgreSQL 16  │
│  (Prisma schema) │
└──────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI framework |
| Vite | 6.3.5 | Build tool & dev server |
| Tailwind CSS | 4.1.12 | Utility-first styling |
| React Router | 7.13.0 | Client-side routing |
| TanStack Query | 5.100.9 | Server state management |
| React Hook Form | 7.55.0 | Form handling & validation |
| Zustand | latest | Client state management |
| Radix UI + MUI | — | Accessible component primitives |
| Recharts | 2.15.2 | Analytics charts |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Express | 5.2.1 | HTTP server framework |
| TypeScript | 6.0.3 | Type safety |
| Prisma ORM | 7.0.0 | Database access & migrations |
| PostgreSQL | 16 | Relational database |
| jsonwebtoken | 9.0.3 | JWT auth |
| bcrypt | 6.0.0 | Password hashing |
| Zod | 4.4.3 | Schema validation |
| Cloudinary | 2.10.0 | Image storage |
| Nodemailer | 8.0.7 | Email delivery |
| node-cron | 4.2.1 | Scheduled jobs |
| Pino | 10.3.1 | Structured logging |
| Helmet | 8.1.0 | HTTP security headers |

### AI Microservice (Python)
| Technology | Purpose |
|-----------|---------|
| FastAPI + Uvicorn | HTTP API server |
| Ultralytics YOLO | Meter ROI + digit detection |
| OpenCV (cv2) | Image preprocessing |
| NumPy | Array operations |

---

## Project Structure

```
FYP-AI-POWERED-METER/
│
├── Backend/                        # Express + TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema (11 models)
│   │   └── migrations/             # Migration history
│   └── src/
│       ├── app.ts                  # Express app setup
│       ├── server.ts               # Entry point
│       ├── config/                 # Env, Cloudinary, mailer
│       ├── routes/                 # 14 route modules
│       ├── services/               # Business logic
│       │   ├── ai/                 # YOLO integration
│       │   ├── auth/               # Auth service
│       │   ├── billing/            # Tariff & bill engine
│       │   ├── email/              # Email templates
│       │   └── storage/            # Cloudinary upload
│       ├── middleware/             # Auth, validation, rate limit
│       ├── jobs/                   # Cron jobs
│       └── lib/                    # JWT, bcrypt, Prisma client
│
├── Frontend/                       # React + Vite SPA
│   └── src/
│       └── app/
│           ├── pages/              # 32+ pages by role
│           ├── components/         # Shared UI components
│           ├── hooks/              # 11 custom hooks
│           └── context/            # Auth & app context
│
└── model/                          # Python AI microservice
    ├── main.py                     # FastAPI server
    ├── best.pt                     # Digit detection model
    ├── meter_roi_best.pt           # ROI detection model
    └── requirements.txt            # Python dependencies
```

---

## Quick Start

### Prerequisites

- Node.js 22+
- Python 3.10+
- PostgreSQL 16
- npm (backend) / pnpm (frontend)
- A Cloudinary account (free tier works)
- An SMTP provider (Gmail, Mailtrap, etc.)

---

### 1. Clone the Repository

```bash
git clone https://github.com/mani901/AI-Powered-Meter-Reading-management.git
cd AI-Powered-Meter-Reading-management
```

---

### 2. Backend Setup

```bash
cd Backend
npm install
cp .env.example .env
```

Edit `.env` with your credentials (see [Environment Variables](#environment-variables)), then:

```bash
# Apply database migrations and generate Prisma client
npm run db:migrate
npm run db:generate

# Seed initial data (admin user, default tariffs)
npm run db:seed

# Start development server
npm run dev
```

Backend runs on `http://localhost:3000`.

---

### 3. Frontend Setup

```bash
cd Frontend
pnpm install
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:3000

pnpm dev
```

Frontend runs on `http://localhost:5173`.

---

### 4. AI Microservice Setup

```bash
cd model
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

AI service runs on `http://localhost:8000`. The backend calls `/predict` on this service when processing meter images.

---

## Environment Variables

### Backend (`Backend/.env`)

```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/meter_db?schema=public"

# CORS
CORS_ORIGIN="http://localhost:5173"

# JWT
JWT_ACCESS_SECRET="your_access_secret_here"
JWT_REFRESH_SECRET="your_refresh_secret_here"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="30d"
BCRYPT_ROUNDS=12

# Cloudinary (image storage)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your@email.com"
SMTP_PASS="your_app_password"
SMTP_FROM="SmartMeter <no-reply@smartmeter.local>"

# AI Microservice
AI_SERVICE_URL="http://localhost:8000"

# App
APP_URL="http://localhost:5173"
DEFAULT_CONFIDENCE_THRESHOLD=0.75
BILL_DUE_DAYS=15


### Frontend (`Frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:3000
```

---

## AI Model

### How It Works

The AI pipeline uses two custom-trained YOLO models in sequence:

```
Meter Image Upload
       │
       ▼
┌─────────────────────────────────────┐
│  Stage 1: ROI Detection             │
│  meter_roi_best.pt                  │
│  → Crops the meter display region   │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Stage 2: 8-Variant Enhancement     │
│  V1: Standard CLAHE                 │
│  V2: Strong CLAHE                   │
│  V3: Fine grid CLAHE                │
│  V4: Bilateral filter + CLAHE       │
│  V5: Unsharp mask + CLAHE           │
│  V6: Gamma correction + CLAHE       │
│  V7: Strong + fine grid CLAHE       │
│  V8: Morphology + CLAHE             │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Stage 3: Digit Extraction          │
│  best.pt runs on each variant       │
│  → Bounding boxes for digits 0–9   │
│  → Confidence score per variant     │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Stage 4: Result Selection          │
│  → Pick highest-confidence variant  │
│  → Sort digits left-to-right        │
│  → Auto-insert decimal point        │
└──────────────────┬──────────────────┘
                   │
                   ▼
          Reading Value + Confidence Score
```

### Prediction API

**Endpoint:** `POST http://localhost:8000/predict`

```bash
curl -X POST http://localhost:8000/predict \
  -F "file=@meter_image.jpg"
```

**Response:**
```json
{
  "reading": "1234.5",
  "confidence": 0.94,
  "digit_count": 5,
  "best_variant": "V4",
  "all_variants": [...]
}
```

---

## API Reference

Base URL: `http://localhost:3000/api`

| Module | Endpoints | Description |
|--------|-----------|-------------|
| `POST /auth/login` | Auth | Login, registration, token refresh |
| `GET /users/me` | Users | Profile and settings management |
| `GET/POST /meters` | Meters | CRUD, status updates, assignments |
| `POST /readings/upload` | Readings | Upload image → AI extraction |
| `GET/POST /readings` | Readings | Submit, review, manage readings |
| `GET /bills` | Billing | Retrieve bills, payment status |
| `GET/POST /tariffs` | Tariffs | Slab management |
| `GET/POST /disputes` | Disputes | Create and track disputes |
| `GET /notifications` | Notifications | In-app alerts |
| `GET /analytics` | Analytics | Consumption and billing reports |
| `* /admin` | Admin | Full admin operations |
| `* /staff` | Staff | Field staff operations |
| `GET /export` | Export | CSV/PDF data export |
| `GET /health` | Health | Service health check |

> Full Postman collection available on request.

---

## Database Schema

11 Prisma models covering the full domain:

```
User ──────────── UserSettings
  │
  ├── Meter ───── StaffMeterAssignment
  │     │
  │     └── Reading ──── Bill ──── Dispute
  │
  ├── Notification
  ├── RefreshToken
  └── AuditLog

Tariff (global, effective-date-based)
```

### Automated Cron Jobs

| Schedule | Job |
|----------|-----|
| Daily 02:00 | Mark overdue bills |
| 1st of month 03:00 | Auto-generate monthly bills |
| Daily 08:00 | Send reading reminder notifications |
| Every hour | Clean up expired refresh tokens |

---

## Scripts Reference

### Backend

```bash
npm run dev          # Start with hot reload (tsx watch)
npm run build        # Compile TypeScript
npm run start        # Run compiled output
npm run db:migrate   # Apply Prisma migrations
npm run db:generate  # Regenerate Prisma client
npm run db:seed      # Seed initial data
npm run db:studio    # Open Prisma Studio (DB GUI)
npm run test         # Run Jest tests
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format with Prettier
```

### Frontend

```bash
pnpm dev             # Start Vite dev server
pnpm build           # Production build to dist/
pnpm preview         # Preview production build
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request against `main`

Please follow the existing TypeScript and ESLint conventions. Run `npm run lint` and `npm run format` before submitting.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built as a Final Year Project · Computer Science**

*If you find this project useful, consider giving it a star ⭐*

</div>
