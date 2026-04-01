# AIRYTY API

> REST API for a full-featured Airbnb-like platform — built with NestJS, PostgreSQL, and Cloudinary.

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma%205-336791?style=flat-square&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white)

---

## Overview

StayHub is a production-ready backend for a vacation rental marketplace. It covers the full lifecycle: user registration, property listing management, booking with date-conflict detection, and payment processing — all with role-based access control.

The codebase is organized into self-contained NestJS feature modules and uses Prisma as the data layer, keeping database queries type-safe and migrations version-controlled.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 (Express adapter) |
| Language | TypeScript 5.7 |
| Database | PostgreSQL via Prisma ORM 5 |
| Auth | Passport.js + JWT |
| File storage | Cloudinary (via Multer memory storage) |
| Validation | class-validator + class-transformer |
| Password hashing | bcryptjs |
| Payments | Stripe (wired up, currently simulated) |
| Testing | Jest + Supertest |

---

## Architecture

```
src/
├── config/              # Joi-validated env schema + typed envs helper
├── modules/
│   ├── auth/            # Register & login — issues JWT
│   ├── users/           # Role promotion, password change, profile update
│   ├── listings/        # Property CRUD + image management (HOST-gated)
│   ├── bookings/        # Reservations with state machine enforcement
│   ├── payments/        # Pay / refund with atomic DB transactions
│   ├── files/           # Multer interceptor + file-type guard
│   ├── cloudinary/      # Upload / delete abstraction over Cloudinary SDK
│   └── prisma/          # Singleton PrismaService injected across modules
└── main.ts              # Bootstrap: ValidationPipe (whitelist), global prefix /api
```

Each module exports only what other modules need. The `PrismaService` is the single database connection shared across the app — no leaking raw clients.

---

## Data Model

```
User ──< Listing ──< Booking >── Payment
                        │
                      Review
```

| Model | Key fields |
|---|---|
| `User` | id · name · email · passwordHash · avatarUrl · role (GUEST/HOST) · stripeCustomerId |
| `Listing` | id · hostId · title · description · city · country · maxGuests · pricePerNight · images (JSON[]) · isActive |
| `Booking` | id · guestId · listingId · checkIn · checkOut · guestCount · totalPrice · status |
| `Payment` | id · bookingId · amount · currency · status · stripePaymentIntentId |
| `Review` | id · bookingId · authorId · rating · comment |

**Booking status machine:**
```
PENDING ──► CONFIRMED ──► COMPLETED
   │              │
   └──────────────┴──► CANCELLED
```

---

## API Reference

Base URL: `https://airyty-backend.onrender.com/api`
Protected endpoints require: `Authorization: Bearer <token>`

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register with optional profile image (`multipart/form-data`) |
| POST | `/auth/login` | — | Login, returns JWT |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| PATCH | `/users/change-role` | JWT | Promote GUEST → HOST |
| PATCH | `/users/change-password` | JWT | Change password (requires current password) |
| PATCH | `/users/update-profile` | JWT | Update name and/or profile image |

### Listings

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/listings` | — | Paginated list with filters (city, country, guests, price range) |
| GET | `/listings/:id` | — | Listing detail |
| POST | `/listings` | HOST | Create listing (up to 10 images) |
| GET | `/listings/host/my-listings` | HOST | Own listings including inactive |
| PATCH | `/listings/:id` | HOST owner | Update text fields |
| POST | `/listings/:id/images` | HOST owner | Add images |
| DELETE | `/listings/:id/images` | HOST owner | Remove image by `publicId` |
| PATCH | `/listings/:id/toggle-active` | HOST owner | Toggle visibility |
| DELETE | `/listings/:id` | HOST owner | Delete listing + all Cloudinary images |

### Bookings

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/bookings` | GUEST | Create booking — auto-calculates price, validates date overlap |
| GET | `/bookings/my-bookings` | GUEST | Own booking history |
| PATCH | `/bookings/:id/cancel` | GUEST | Cancel own booking |
| GET | `/bookings/host/incoming` | HOST | All bookings on own listings |
| PATCH | `/bookings/:id/status` | HOST | Advance booking through state machine |
| GET | `/bookings/:id` | GUEST or HOST | Booking detail |

### Payments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/payments/booking/:bookingId` | GUEST | Pay for a booking → atomically sets SUCCEEDED + CONFIRMED |
| GET | `/payments/booking/:bookingId` | GUEST or HOST | Get payment for a booking |
| POST | `/payments/booking/:bookingId/refund` | GUEST | Refund → atomically sets REFUNDED + CANCELLED |

> Stripe is installed and the schema has `stripePaymentIntentId` / `stripeCustomerId`. Payments currently run in simulation mode (no real charge) and are designed to drop in real Stripe calls with minimal changes.

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- PostgreSQL running locally (or a hosted connection string)
- Cloudinary account (free tier works)

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

Create a `.env` file in `/backend`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
JWT_SECRET="your-secret-here"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
PORT=3000
```

### 3. Run migrations and start

```bash
npx prisma migrate dev    # create tables
npx prisma generate       # generate Prisma client
npm run start:dev         # start with hot reload
```

The API is available at `https://airyty-backend.onrender.com/api`.

---

## Scripts

```bash
npm run start:dev     # development with hot reload
npm run build         # compile TypeScript
npm run start:prod    # run compiled build
npm run test          # unit tests
npm run test:cov      # tests with coverage report
npm run test:e2e      # end-to-end tests
npm run lint          # ESLint with auto-fix
npm run format        # Prettier
```

---

> **Render free tier:** the service sleeps after 15 min of inactivity — first request takes ~30s to wake up. Mention this to anyone testing the live URL.


## Design Decisions

**Modular architecture** — each domain (auth, listings, bookings…) is an isolated NestJS module. Adding or removing a feature does not ripple across the codebase.

**Atomic payment transactions** — paying and confirming a booking, as well as refunding and cancelling, happen inside a single `prisma.$transaction`. This prevents a state where money moved but the booking record did not update.

**Date conflict detection** — before creating a booking the server checks for overlapping PENDING or CONFIRMED reservations on the same listing. A host cannot book their own listing.

**Cloudinary cleanup** — images are always deleted from Cloudinary before their records are removed from the database. Deleting a listing cascades to removing every associated image from the CDN.

**Validation at the boundary** — `ValidationPipe` with `whitelist: true` strips undeclared fields from every incoming request. DTOs use `class-validator` decorators so invalid payloads are rejected before reaching service logic.

**Role-based access via JWT** — the `JwtAuthGuard` validates the token and attaches the user to the request. A custom `RolesGuard` checks the `Role` enum against a `@Roles()` decorator, keeping auth concerns out of business logic.

---

## Project Status

| Feature | Status |
|---|---|
| Auth (register / login) | Done |
| User profile management | Done |
| Listing CRUD + images | Done |
| Booking lifecycle | Done |
| Payment (simulated) | Done |
| Real Stripe integration | Pending |
| Reviews | Schema ready — endpoints pending |
| Frontend (Next.js) | In progress |
