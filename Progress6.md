# Phase 6 Progress: Bookings & Calendar Module

- [x] Backend: Bookings module scaffold (`apps/api/src/modules/bookings/` - repository, service, controller, routes)
- [x] Backend: `POST /api/v1/bookings` (Propose session, validate participant `TEACH` skills, future `scheduledAt`, emit `booking:update`)
- [x] Backend: `PATCH /api/v1/bookings/:id` (Transition: `CONFIRMED`, `DECLINED`, `CANCELLED` with 1-hour cutoff window, authorization check)
- [x] Backend: `GET /api/v1/bookings?status=&when=upcoming|past` (Filterable list by user)
- [x] Backend: BullMQ background job (`apps/api/src/jobs/bookingAutoComplete.job.ts` - transitions finished `CONFIRMED` bookings to `COMPLETED`)
- [x] Backend: Jest/Supertest test suite covering valid proposal, invalid skill rejection, non-ACCEPTED match rejection, authorization rules, cancellation cutoff, and auto-complete logic
- [x] Frontend: `ProposeSessionModal` integrated with real-time Chat header button
- [x] Frontend: Inline proposed session card in Chat with instant Confirm/Decline actions
- [x] Frontend: Real-time UI synchronization via `booking:update` socket event
- [x] Frontend: `BookingsPage` (`apps/web/src/routes/BookingsPage.tsx`) with React Big Calendar (month/week/day) and list view toggle
- [x] Frontend: Phase 7 "Leave Review" button hook in Bookings list for `COMPLETED` sessions
