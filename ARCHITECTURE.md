# SkillBridge — System Architecture Document

**Version:** 1.0
**Author:** Senior Engineering Design
**Status:** Ready for implementation
**Type:** Full-stack Web Application (PWA-installable), API-first design for future mobile client

---

## 1. Product Overview

### 1.1 What it is
SkillBridge is a peer-to-peer skill exchange platform. Users list skills they can **teach** and skills they want to **learn**. The system matches complementary users, lets them chat in real time, schedule sessions, and leave reviews afterward — a "Tinder for learning."

### 1.2 Name & Branding

- **Product name:** **SkillBridge**
- **Tagline:** *"Teach one, learn one."*
- **Domain-style handle:** skillbridge.app
- **Logo concept:** Two overlapping rounded arcs forming a bridge/handshake silhouette, using the primary and accent colors below. Simple enough to render as a 32×32 favicon.

### 1.3 Theme & Design Direction

**Design language:** Clean, modern "calm productivity" — think Linear/Notion warmth crossed with a community-marketplace feel (like a friendlier Duolingo). Rounded corners, soft shadows, generous white space, no harsh gradients.

**Typography:**
- Headings: `Sora` (geometric, friendly, distinctive) — weights 600/700
- Body: `Inter` — weights 400/500
- Monospace (code snippets/admin): `JetBrains Mono`

**Color Palette**

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#3D5AFE` | Primary buttons, links, active states |
| `--color-primary-dark` | `#2A3EB1` | Hover/pressed states |
| `--color-accent` | `#FF8A5B` | CTAs, highlights, badges (complementary to primary) |
| `--color-success` | `#2ECC71` | Confirmed bookings, positive states |
| `--color-warning` | `#FFC94D` | Pending states |
| `--color-error` | `#EB5757` | Errors, destructive actions |
| `--color-bg` | `#F7F8FC` | App background (light mode) |
| `--color-surface` | `#FFFFFF` | Cards, modals |
| `--color-border` | `#E4E7EE` | Dividers, input borders |
| `--color-text-primary` | `#1A1D29` | Headings, primary text |
| `--color-text-secondary` | `#6B7080` | Secondary/muted text |
| `--color-dark-bg` | `#12131A` | Dark mode background |
| `--color-dark-surface` | `#1D1F2B` | Dark mode cards |

**Layout principles:**
- Max content width: `1200px`, centered
- 8px spacing grid (`4, 8, 12, 16, 24, 32, 48, 64`)
- Border radius: `12px` cards, `8px` inputs/buttons, `999px` pills/avatars
- Shadows: soft, single-direction (`0 2px 8px rgba(0,0,0,0.06)`), no harsh drop shadows
- Mobile-first breakpoints: `sm: 640px, md: 768px, lg: 1024px, xl: 1280px`

**Core screens/layout pattern:**
- **App shell:** left sidebar nav (desktop) / bottom tab bar (mobile) — Home/Discover, Matches, Chat, Bookings, Profile
- **Discover screen:** swipeable/browsable card stack of potential matches (skill-based)
- **Chat screen:** classic two-pane (conversation list + active thread) on desktop, stacked on mobile
- **Booking screen:** calendar view + list view toggle
- **Profile screen:** teach/learn skill tags as pill chips, bio, rating stars, availability grid

---

## 2. Tech Stack (Required)

### 2.1 Frontend
- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS + CSS variables (theme tokens above)
- **State (server cache):** TanStack Query (React Query)
- **State (client/global):** Zustand
- **Routing:** React Router v6
- **Forms & validation:** React Hook Form + Zod
- **Real-time client:** socket.io-client
- **Calendar UI:** react-big-calendar
- **Icons:** lucide-react
- **PWA:** vite-plugin-pwa

### 2.2 Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express + TypeScript (NestJS acceptable as a stretch alternative if the developer wants stronger DI/module structure)
- **ORM:** Prisma
- **Database:** PostgreSQL 15
- **Cache/session/pubsub:** Redis (Socket.io adapter, rate limiting, refresh-token blacklist)
- **Auth:** JWT (access 15 min + refresh 7 days), bcrypt password hashing
- **Validation:** Zod (shared schemas package between frontend/backend where possible)
- **Real-time:** Socket.io server
- **File storage:** Cloudinary (images) via signed upload
- **Email:** Resend or Nodemailer + SMTP (password reset, notifications)
- **Job queue (optional, for reminders):** BullMQ + Redis

### 2.3 Infrastructure & DevOps
- **Frontend hosting:** Vercel
- **Backend hosting:** Render or Railway
- **Database hosting:** Neon or Supabase Postgres
- **CI/CD:** GitHub Actions (lint → test → build → deploy)
- **Error tracking:** Sentry (frontend + backend)
- **Monitoring/uptime:** UptimeRobot (free tier)
- **Testing:** Jest + Supertest (backend), Vitest + React Testing Library (frontend), Playwright (E2E, stretch)

### 2.4 Monorepo Structure

```
skillbridge/
├── apps/
│   ├── web/                 # React frontend
│   └── api/                 # Express backend
├── packages/
│   ├── shared-types/        # Zod schemas + TS types shared FE/BE
│   └── config/              # eslint/tsconfig/tailwind shared configs
├── .github/workflows/
├── docker-compose.yml       # local Postgres + Redis
├── package.json             # npm/pnpm workspaces
└── ARCHITECTURE.md
```

Use **pnpm workspaces** or **Turborepo** for the monorepo tooling.

---

## 3. System Architecture Diagram (conceptual)

```
┌─────────────────────┐        HTTPS/REST        ┌──────────────────────┐
│                      │ ────────────────────────▶│                      │
│   React SPA (Vite)   │                            │   Express API        │
│   apps/web            │◀──────────────────────── │   apps/api            │
│                      │      JSON responses       │                      │
│   - React Query      │                            │  - Auth (JWT)        │
│   - Zustand           │       WebSocket            │  - Controllers       │
│   - Socket.io-client ◀├───────────────────────────▶│  - Socket.io server │
└──────────┬───────────┘                            └──────────┬───────────┘
           │                                                   │
           │ static hosting                                   │ Prisma ORM
           ▼                                                   ▼
     ┌───────────┐                                   ┌──────────────────┐
     │  Vercel   │                                   │   PostgreSQL      │
     │  CDN      │                                   │   (Neon/Supabase) │
     └───────────┘                                   └──────────────────┘
                                                              │
                                                              ▼
                                                     ┌──────────────────┐
                                                     │   Redis           │
                                                     │  (sessions,       │
                                                     │   sockets, queue) │
                                                     └──────────────────┘
                                                              │
                                            ┌─────────────────┴─────────────────┐
                                            ▼                                   ▼
                                   ┌────────────────┐                ┌──────────────────┐
                                   │  Cloudinary     │                │  Resend/SMTP      │
                                   │  (media)        │                │  (emails)         │
                                   └────────────────┘                └──────────────────┘
```

**Separation of concerns:**
- Frontend never talks to the database directly — everything goes through the REST API or WebSocket gateway.
- Backend is stateless (JWT-based) except for Socket.io connection state, which is backed by Redis so the API can scale horizontally.
- Shared Zod schemas in `packages/shared-types` keep request/response contracts identical on both sides — no drift between frontend expectations and backend validation.

---

## 4. Database Schema (Prisma models)

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String
  avatarUrl     String?
  bio           String?
  location      String?
  timezone      String?
  isVerified    Boolean   @default(false)
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  teachSkills   UserSkill[] @relation("TeachSkills")
  learnSkills   UserSkill[] @relation("LearnSkills")
  availability  Availability[]
  sentMatches   Match[]      @relation("RequestedBy")
  receivedMatches Match[]    @relation("RequestedTo")
  messages      Message[]
  bookingsAsHost   Booking[] @relation("HostBookings")
  bookingsAsGuest  Booking[] @relation("GuestBookings")
  reviewsGiven  Review[]     @relation("ReviewAuthor")
  reviewsReceived Review[]   @relation("ReviewTarget")
  notifications Notification[]
  refreshTokens RefreshToken[]
}

enum Role {
  USER
  ADMIN
}

model Skill {
  id       String @id @default(uuid())
  name     String @unique
  category String

  userSkills UserSkill[]
}

model UserSkill {
  id        String   @id @default(uuid())
  userId    String
  skillId   String
  type      SkillType   // TEACH or LEARN
  level     Int?        // 1-5 proficiency, only relevant for TEACH

  user      User  @relation(fields: [userId], references: [id], name: "TeachSkills")
  learnUser User  @relation(fields: [userId], references: [id], name: "LearnSkills")
  skill     Skill @relation(fields: [skillId], references: [id])

  @@unique([userId, skillId, type])
}

enum SkillType {
  TEACH
  LEARN
}

model Availability {
  id        String   @id @default(uuid())
  userId    String
  dayOfWeek Int      // 0-6
  startTime String   // "18:00"
  endTime   String   // "20:00"

  user User @relation(fields: [userId], references: [id])
}

model Match {
  id            String      @id @default(uuid())
  requestedById String
  requestedToId String
  status        MatchStatus @default(PENDING)
  matchScore    Float
  createdAt     DateTime    @default(now())

  requestedBy User @relation("RequestedBy", fields: [requestedById], references: [id])
  requestedTo User @relation("RequestedTo", fields: [requestedToId], references: [id])
  messages    Message[]
  bookings    Booking[]

  @@unique([requestedById, requestedToId])
}

enum MatchStatus {
  PENDING
  ACCEPTED
  DECLINED
  BLOCKED
}

model Message {
  id        String   @id @default(uuid())
  matchId   String
  senderId  String
  content   String
  readAt    DateTime?
  createdAt DateTime @default(now())

  match  Match @relation(fields: [matchId], references: [id])
  sender User  @relation(fields: [senderId], references: [id])
}

model Booking {
  id          String        @id @default(uuid())
  matchId     String
  hostId      String
  guestId     String
  skillId     String
  scheduledAt DateTime
  durationMin Int           @default(60)
  status      BookingStatus @default(PROPOSED)
  createdAt   DateTime      @default(now())

  match Match @relation(fields: [matchId], references: [id])
  host  User  @relation("HostBookings", fields: [hostId], references: [id])
  guest User  @relation("GuestBookings", fields: [guestId], references: [id])
  review Review?
}

enum BookingStatus {
  PROPOSED
  CONFIRMED
  DECLINED
  COMPLETED
  CANCELLED
}

model Review {
  id         String   @id @default(uuid())
  bookingId  String   @unique
  authorId   String
  targetId   String
  rating     Int      // 1-5
  comment    String?
  createdAt  DateTime @default(now())

  booking Booking @relation(fields: [bookingId], references: [id])
  author  User    @relation("ReviewAuthor", fields: [authorId], references: [id])
  target  User    @relation("ReviewTarget", fields: [targetId], references: [id])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // "NEW_MATCH" | "NEW_MESSAGE" | "BOOKING_UPDATE" | "NEW_REVIEW"
  payload   Json
  readAt    DateTime?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  tokenHash String
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

---

## 5. API Design (REST endpoints)

Base URL: `/api/v1`

### 5.1 Auth
| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Create account, send verification email |
| POST | `/auth/login` | Returns access + refresh token |
| POST | `/auth/refresh` | Rotate refresh token, issue new access token |
| POST | `/auth/logout` | Revoke refresh token |
| POST | `/auth/forgot-password` | Send reset email |
| POST | `/auth/reset-password` | Set new password with token |
| GET | `/auth/verify-email/:token` | Verify email address |

### 5.2 Users & Profile
| Method | Route | Description |
|---|---|---|
| GET | `/users/me` | Current user profile |
| PATCH | `/users/me` | Update profile (bio, avatar, location, timezone) |
| GET | `/users/:id` | Public profile view |
| PUT | `/users/me/skills` | Set teach/learn skill lists |
| PUT | `/users/me/availability` | Set weekly availability |

### 5.3 Skills
| Method | Route | Description |
|---|---|---|
| GET | `/skills` | List/search all skills (autocomplete) |
| POST | `/skills` | Create new skill tag if not existing |

### 5.4 Discover / Matching
| Method | Route | Description |
|---|---|---|
| GET | `/discover` | Paginated candidate list, ranked by match score |
| POST | `/matches` | Send a match request `{ requestedToId }` |
| PATCH | `/matches/:id` | Accept/decline a match request |
| GET | `/matches` | List current user's matches (by status) |

**Match score algorithm (v1, simple & explainable):**
```
score = (sharedTeachToLearnOverlap * 2) + (sharedLearnToTeachOverlap * 2)
        + availabilityOverlapBonus (0-1)
        + proximityBonus (0-1, optional if location present)
```
This is intentionally simple for v1 — documented as a clear extension point for a stretch-goal ML-based recommender later.

### 5.5 Messaging
| Method | Route | Description |
|---|---|---|
| GET | `/matches/:matchId/messages` | Paginated message history |
| POST | `/matches/:matchId/messages` | Send message (also emitted via socket) |

### 5.6 Bookings
| Method | Route | Description |
|---|---|---|
| POST | `/bookings` | Propose a session `{ matchId, skillId, scheduledAt, durationMin }` |
| PATCH | `/bookings/:id` | Confirm/decline/cancel |
| GET | `/bookings` | List bookings (upcoming/past, filter by status) |

### 5.7 Reviews
| Method | Route | Description |
|---|---|---|
| POST | `/bookings/:id/review` | Submit review after `COMPLETED` booking |
| GET | `/users/:id/reviews` | Public reviews for a user |

### 5.8 Notifications
| Method | Route | Description |
|---|---|---|
| GET | `/notifications` | List notifications |
| PATCH | `/notifications/:id/read` | Mark as read |

All endpoints (except `/auth/*` and `GET /skills`) require `Authorization: Bearer <accessToken>`.

---

## 6. Real-Time Layer (Socket.io)

**Namespace:** `/ws`
**Auth:** access token passed during handshake, verified before connection accepted.

**Events (client → server):**
- `message:send` `{ matchId, content }`
- `typing:start` / `typing:stop` `{ matchId }`

**Events (server → client):**
- `message:new` `{ message }`
- `typing:update` `{ matchId, userId, isTyping }`
- `match:new` `{ match }`
- `booking:update` `{ booking }`
- `notification:new` `{ notification }`

Redis adapter (`@socket.io/redis-adapter`) is used so multiple API instances share socket room state — required for horizontal scaling beyond a single server.

---

## 7. Frontend Architecture

### 7.1 Folder structure (`apps/web/src`)
```
src/
├── main.tsx
├── App.tsx
├── routes/               # route-level pages
│   ├── DiscoverPage.tsx
│   ├── MatchesPage.tsx
│   ├── ChatPage.tsx
│   ├── BookingsPage.tsx
│   └── ProfilePage.tsx
├── components/
│   ├── ui/               # buttons, inputs, cards (design system primitives)
│   ├── skills/
│   ├── chat/
│   ├── booking/
│   └── layout/           # AppShell, Sidebar, BottomNav
├── hooks/                # useAuth, useSocket, useMatches, etc.
├── stores/               # Zustand stores (authStore, uiStore)
├── api/                  # typed API client functions (fetch wrappers)
├── lib/                  # socket client setup, query client setup
├── styles/               # tailwind.css, theme tokens
└── types/                # re-exported from packages/shared-types
```

### 7.2 State management split
- **Server state** (users, matches, messages, bookings) → React Query, cached by query key, invalidated on relevant mutations/socket events.
- **Client/UI state** (modals open, active tab, draft message text) → Zustand.
- **Auth state** (access token in memory, refresh token in httpOnly cookie) → Zustand store + Axios interceptor for auto-refresh.

### 7.3 Key UI flows
1. **Onboarding:** Register → verify email → set up profile → add teach/learn skills → set availability → land on Discover.
2. **Discover → Match:** Browse candidate cards → send match request → wait for accept → chat unlocks.
3. **Chat → Booking:** Within a chat thread, either party can tap "Propose session" → pick skill + time slot → other party confirms → appears on both calendars.
4. **Booking → Review:** After `scheduledAt + durationMin` passes, booking auto-flips to `COMPLETED` (via scheduled job) → both users prompted to review.

---

## 8. Backend Architecture

### 8.1 Folder structure (`apps/api/src`)
```
src/
├── server.ts
├── app.ts                  # Express app setup, middleware
├── config/                 # env, db, redis clients
├── modules/
│   ├── auth/                # controller, service, routes, validators
│   ├── users/
│   ├── skills/
│   ├── discover/
│   ├── matches/
│   ├── messages/
│   ├── bookings/
│   ├── reviews/
│   └── notifications/
├── middleware/
│   ├── auth.middleware.ts   # verify JWT
│   ├── error.middleware.ts
│   └── rateLimit.middleware.ts
├── sockets/
│   ├── index.ts             # socket.io server bootstrap
│   └── handlers/
├── jobs/                    # BullMQ workers (booking auto-complete, email reminders)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── utils/
```

Each module follows **controller → service → repository (Prisma)** layering: controllers only handle HTTP concerns, services hold business logic, Prisma calls are isolated so logic is testable without hitting a real DB (mockable in Jest).

### 8.2 Security checklist
- Passwords hashed with bcrypt (cost factor 12)
- JWT access tokens short-lived (15 min); refresh tokens rotated and stored hashed in DB, revocable
- Rate limiting on `/auth/*` (express-rate-limit + Redis store)
- Input validation on every route via Zod schemas shared with frontend
- Helmet.js for HTTP headers, CORS locked to frontend origin
- SQL injection not applicable (Prisma parameterizes queries) but Zod still validates shapes
- File uploads restricted by type/size, signed Cloudinary uploads (no raw key on frontend)

---

## 9. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | API p95 response time < 300ms for standard CRUD; Discover query paginated (20/page) |
| Scalability | Stateless API instances behind load balancer; Redis-backed sockets allow horizontal scaling |
| Availability | Target 99% uptime on free/hobby tiers; documented as acceptable for portfolio-scale project |
| Accessibility | WCAG AA contrast ratios respected in the color palette above; all interactive elements keyboard-navigable |
| Responsiveness | Fully usable from 360px width up; PWA installable on mobile home screen |
| Internationalization | English only for v1; text externalized in a single `strings.ts` file to make i18n straightforward later |
| Testing | Minimum 70% coverage on backend services; critical frontend flows covered by Vitest + RTL |

---

## 10. Build Roadmap (mapped to this architecture)

| Phase | Deliverable |
|---|---|
| 1 | Monorepo scaffold, CI pipeline, docker-compose for local Postgres/Redis, Prisma schema + migrations |
| 2 | Auth module end-to-end (register/login/refresh/verify/reset), protected route middleware |
| 3 | Profile + skills CRUD, availability editor |
| 4 | Discover endpoint + matching algorithm + Discover UI |
| 5 | Match request flow + Socket.io chat |
| 6 | Booking flow + calendar UI + auto-complete job |
| 7 | Reviews + notifications (in-app + email) |
| 8 | Polish: dark mode, PWA manifest, Sentry, Playwright smoke tests, deployment, README + demo video |

---

## 11. What Goes in the Portfolio Write-Up

When presenting this project, highlight:
- **System design decisions**: why stateless JWT + Redis-backed sockets, why Prisma over raw SQL, why shared Zod schemas across FE/BE.
- **The matching algorithm** as a concrete, explainable feature (not just CRUD) — a good talking point for interviews.
- **Real-time architecture** (Socket.io + Redis adapter) as evidence of understanding scaling concerns beyond a toy app.
- **Security decisions** (token rotation, bcrypt cost factor, rate limiting) as evidence of production-mindedness.

---

*End of architecture document. This document is the single source of truth for implementation — every module, route, and schema above should be built exactly as specified unless a deviation is documented here first.*