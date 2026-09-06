# Phase 5 Progress: Real-Time Chat Module

- [x] Backend: Messages module scaffold (repository, service, controller, routes)
- [x] Backend: `GET /api/v1/matches/:matchId/messages` (paginated history, 403 authorization check for non-participants)
- [x] Backend: `POST /api/v1/matches/:matchId/messages` (persists message, validates `ACCEPTED` status, emits `message:new`)
- [x] Backend: `PATCH /api/v1/matches/:matchId/messages/read` (marks unread messages as read)
- [x] Backend: Socket handlers (`message:send`, `typing:start`, `typing:stop`, broadcasting `typing:update`)
- [x] Backend: Socket.io Redis adapter wired with Redis pub/sub (`pubClient` & `subClient`)
- [x] Backend: Jest & Supertest test suite for Messages module (all tests passing)
- [x] Frontend: Chat screen (`apps/web/src/routes/ChatPage.tsx`) with 2-pane desktop / 1-pane mobile layout
- [x] Frontend: Real-time send & receive via Socket `message:send` with REST fallback
- [x] Frontend: Typing indicator & unread message count badges
- [x] Frontend: Matches screen updated with direct link into Chat
- [x] Frontend: Phase 6 "Propose Session" button spot commented in Chat header
