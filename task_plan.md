# Implementation Plan - EventHive — Campus Event & Booking System

An end-to-end event discovery, ticket reservation, and administrative management platform designed for college campuses.

## 1. Tech Stack Overview
* **Frontend:** Next.js (App Router), Tailwind CSS, Lucide Icons, Recharts (analytics)
* **Backend:** Node.js, Express.js
* **Database & ORM:** PostgreSQL, Prisma ORM
* **Authentication & Services:** JWT / NextAuth.js, Nodemailer (email receipts), QRCode.js / HTML5-QRCode

---

## 2. System Architecture & Data Schema

### Core Data Models (Prisma Schema Reference)
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  STUDENT
  ORGANIZER
  ADMIN
}

enum BookingStatus {
  CONFIRMED
  CHECKED_IN
  CANCELLED
}

enum EventStatus {
  DRAFT
  PUBLISHED
  CANCELLED
}

model User {
  id           String    @id @default(uuid())
  name         String
  email        String    @unique
  passwordHash String
  role         Role      @default(STUDENT)
  createdAt    DateTime  @default(now())
  events       Event[]   @relation("OrganizerEvents")
  bookings     Booking[]
  reviews      Review[]
}

model Event {
  id             String      @id @default(uuid())
  title          String
  description    String
  category       String
  venue          String
  startDateTime  DateTime
  endDateTime    DateTime
  capacity       Int
  availableSeats Int
  price          Float       @default(0.0)
  status         EventStatus @default(PUBLISHED)
  organizerId    String
  organizer      User        @relation("OrganizerEvents", fields: [organizerId], references: [id])
  bookings       Booking[]
  reviews        Review[]
  createdAt      DateTime    @default(now())
}

model Booking {
  id            String        @id @default(uuid())
  eventId       String
  event         Event         @relation(fields: [eventId], references: [id])
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  qrCodeString  String        @unique
  status        BookingStatus @default(CONFIRMED)
  createdAt     DateTime      @default(now())
}

model Review {
  id        String   @id @default(uuid())
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  rating    Int
  comment   String?
  createdAt DateTime @default(now())
}
```

---

## 3. Directory Structure

```text
campus-event-system/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── eventController.js
│   │   │   └── bookingController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── roleMiddleware.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── events.js
│   │   │   └── bookings.js
│   │   ├── utils/
│   │   │   ├── qrGenerator.js
│   │   │   └── emailService.js
│   │   └── server.js
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/
    │   │   │   ├── login/page.js
    │   │   │   └── register/page.js
    │   │   ├── dashboard/
    │   │   │   ├── student/page.js
    │   │   │   └── organizer/page.js
    │   │   ├── events/
    │   │   │   ├── page.js
    │   │   │   └── [id]/page.js
    │   │   ├── check-in/page.js
    │   │   └── page.js
    │   ├── components/
    │   │   ├── EventCard.jsx
    │   │   ├── Navbar.jsx
    │   │   └── QRScanner.jsx
    │   └── lib/
    │       └── api.js
    └── package.json
```

---

## 4. Phased Implementation Roadmap

### Phase 1: Project Setup & Database Schema [COMPLETED]
* Initialize `backend` (Express) and `frontend` (Next.js with Tailwind CSS).
* Set up database connection and configure `schema.prisma`.
* Generated database client and initialized SQLite schema for local zero-dependency testing.
* Setup environment variables (`.env`) for DB connection strings, JWT secret, and SMTP settings.

### Phase 2: Authentication & Role Management [COMPLETED]
* Implement JWT authentication in backend (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`).
* Add role-based access control middleware (`STUDENT`, `ORGANIZER`, `ADMIN`).
* Build frontend Login/Register forms and set up auth context/session state with persistent JWT.

### Phase 3: Core Event Management (CRUD) [COMPLETED]
* Build API endpoints for event creation, editing, deleting, and public listing with search/filters.
* Implement Organizer Dashboard to create and publish events with capacity limits.
* Build public Event Feed and detailed Event View pages with real-time seat availability counters.

### Phase 4: Booking Engine & QR Code Ticket Generation [COMPLETED]
* Build booking API endpoint handling concurrent bookings and atomic seat decrements using database transactions.
* Integrate `qrcode` library to generate unique token payload and base64 Data URLs upon booking.
* Configure Nodemailer to dispatch confirmation email with embedded QR ticket (with console logging fallback).
* Build Student Dashboard to view active bookings and display scannable QR tickets.

### Phase 5: Event Check-in & Verification System [COMPLETED]
* Build mobile-friendly Organizer Check-in page (`/check-in`) with organizer role guards.
* Integrate web camera QR code scanner (`html5-qrcode`).
* Implement manual fallback input field for booking IDs and student emails.
* Implement verification API endpoint (`/api/bookings/verify`) that updates booking status from `CONFIRMED` to `CHECKED_IN` and prevents duplicate entries with clear green/red feedback.

### Phase 6: Analytics Dashboard & Testing [COMPLETED]
* Build organizer analytics endpoint (`GET /api/events/analytics/overview`) computing conversion rates, ticket sales, and occupancy breakdown.
* Build dynamic visual chart cards on Organizer Dashboard using Recharts (attendance breakdown bar chart and ticket status distribution donut chart).
* Completed 100% successful end-to-end smoke test covering double-booking prevention, RBAC authorization, token expiry, and check-in edge cases.

---

## 5. Key Verification Checkpoints

1. **Database Transactions:** Ensure booking a seat decreases `availableSeats` in a database transaction to prevent race conditions and overbooking.
2. **Role Security:** Verify that `/check-in` and Event Creation routes reject non-organizer tokens.
3. **QR Flow Verification:** Verify that scanning a generated ticket QR code correctly marks the user as `CHECKED_IN` in the database and rejects repeated scans.