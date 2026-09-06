# Phase 7 Progress: Reviews & Notifications Module

- [x] Backend: Reviews module scaffold (`apps/api/src/modules/reviews/` - repository, service, controller, routes)
- [x] Backend: `POST /api/v1/bookings/:id/review` (validates `COMPLETED` booking status, participant authorization, duplicate prevention, creates `NEW_REVIEW` notification)
- [x] Backend: `GET /api/v1/users/:id/reviews` (paginated public reviews with dynamic average rating aggregation)
- [x] Backend: Notifications module scaffold (`apps/api/src/modules/notifications/` - repository, service, controller, routes)
- [x] Backend: `GET /api/v1/notifications` (paginated, most recent first, includes unread count)
- [x] Backend: `PATCH /api/v1/notifications/:id/read` (marks single notification as read)
- [x] Backend: Persistent notification creation across all 4 event types: `NEW_MATCH`, `NEW_MESSAGE`, `BOOKING_UPDATE`, and `NEW_REVIEW`
- [x] Backend: Real-time `notification:new` socket event emission
- [x] Backend: Nodemailer email service integration for `NEW_MATCH` and `BOOKING_UPDATE`
- [x] Backend: Full Jest/Supertest test suite (17/17 tests passing across Auth, Messages, Bookings, Reviews, and Notifications)
- [x] Frontend: `ReviewModal` dialog with interactive 5-star rating and comment input
- [x] Frontend: "Leave Review" button wired on `COMPLETED` bookings in `BookingsPage`
- [x] Frontend: Public reviews and average rating score display on `ProfilePage`
- [x] Frontend: `NotificationBell` in `AppShell` with live unread badge, popover listing, click-to-navigate, and mark-as-read
