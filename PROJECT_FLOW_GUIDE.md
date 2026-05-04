# Timesheet App - Complete Flow Guide

This file explains:
- how the app works end-to-end
- which file is connected to which file
- what packages are used in frontend and backend

---

## 1) High-Level Architecture

- `frontend` (React + MSAL) handles UI, login screens, and calling APIs.
- `backend`  (Express + MSSQL) handles auth APIs, user/timesheet data, token validation, and DB access.
- Authentication supports:
  - Local register/login (email + password)
  - Microsoft login (MSAL redirect + token sync)

---

## 2)w Frontend File Linking (How files connect)

1. Entry point:
   - `frontend/src/main.tsx`
   - Wraps app with `MsalProvider` using `msalInstance` from `frontend/src/auth/authConfig.ts`.

2. Main app controller:
   - `frontend/src/App.tsx`
   - Decides which screen to show:
     - Login screen (`Login.tsx`) if user session not available
     - Dashboard (`Dashboard.tsx`) inside `MainLayout.tsx` if logged in
   - Stores session in browser `localStorage`:
     - `appToken`
     - `appUser`

3. Auth UI:
   - `frontend/src/pages/Login.tsx`
   - Handles:
     - local register: `POST /auth/register`
     - local login: `POST /auth/login`
     - Microsoft login redirect: `instance.loginRedirect(loginRequest)`

4. Microsoft sync:
   - In `App.tsx`, after Microsoft account is detected, app gets Microsoft token and calls:
   - `POST http://localhost:5001/auth/microsoft/sync`
   - Backend returns app JWT + user object, then frontend saves them.

5. Dashboard API calls:
   - `frontend/src/pages/Dashboard.tsx`
   - Calls timesheet APIs with app token in `Authorization: Bearer <token>` header:
     - `GET /timesheet`
     - `POST /timesheet`
     - `PUT /timesheet/:id`
     - `DELETE /timesheet/:id`

6. Layout / logout UI:
   - `frontend/src/layout/MainLayout.tsx`
   - Renders top bar + logout button
   - Logout function comes from `App.tsx`

7. Styling:
   - `frontend/src/index.css`

---

## 3) Backend File Linking (How files connect)

1. Server bootstrap:
   - `backend/src/server.ts`
   - Configures Express + CORS + JSON middleware
   - Mounts routers:
     - `/auth` -> `routes/auth.routes.ts`
     - `/timesheet` -> `routes/timesheet.routes.ts`
   - Connects DB and runs schema setup:
     - `connectDB()`
     - `ensureSchema()`

2. DB config + schema:
   - `backend/src/config/db.ts`
   - `connectDB()` creates MSSQL pool using `.env` values
   - `ensureSchema()` creates/updates:
     - `Users` table
     - `Timesheets.userId` column
     - FK from `Timesheets.userId` to `Users.id`

3. Auth routes:
   - `backend/src/routes/auth.routes.ts`
   - Endpoints:
     - `POST /auth/register`
     - `POST /auth/login`
     - `POST /auth/microsoft/sync`

4. Auth controller:
   - `backend/src/controllers/auth.controller.ts`
   - `register`: hashes password and inserts user
   - `login`: checks password and issues app JWT
   - `microsoftSync`: validates Microsoft claims (set by middleware), upserts/fetches user, issues app JWT

5. Microsoft token validation middleware:
   - `backend/src/middleware/verifyMicrosoftToken.ts`
   - Verifies incoming Microsoft token using Microsoft JWKS
   - On success attaches claims to `req.user`

6. App JWT validation middleware:
   - `backend/src/middleware/verifyAppToken.ts`
   - Verifies app token signed with `APP_JWT_SECRET`
   - On success attaches user info to `req.appUser`

7. Timesheet routes and controller:
   - `backend/src/routes/timesheet.routes.ts`
   - Applies `verifyAppToken` to all timesheet routes
   - `backend/src/controllers/timesheet.controller.ts`
   - All CRUD queries are scoped by `req.appUser.userId` so each user sees only their own data.

---

## 4) End-to-End Runtime Flows

## A) Local Register/Login Flow

1. User opens app -> `App.tsx` sees no session -> shows `Login.tsx`
2. User registers or logs in
3. Frontend calls backend (`/auth/register` or `/auth/login`)
4. Backend returns app token + user
5. Frontend stores them in localStorage
6. `App.tsx` renders dashboard

## B) Microsoft Login Flow

1. User clicks "Sign in with Microsoft"
2. Browser redirects to Microsoft login page
3. After successful login, MSAL account appears in frontend
4. `App.tsx` acquires Microsoft token and calls `/auth/microsoft/sync`
5. Backend verifies Microsoft token and creates/fetches user in `Users`
6. Backend returns app token + user
7. Frontend stores session and opens dashboard

## C) Timesheet Data Flow

1. Dashboard sends app JWT in `Authorization` header
2. Backend middleware validates token and gets `userId`
3. Controller queries only that user's rows (`WHERE userId = @userId`)
4. Frontend receives only current user's data

## D) Logout Flow

1. User clicks logout in `MainLayout`
2. `App.tsx` clears local session (`appToken`, `appUser`)
3. If Microsoft session exists, logout redirect is triggered
4. User returns to login screen

---

## 5) Frontend Packages

From `frontend/package.json`:

### Dependencies
- `react`
- `react-dom`
- `@azure/msal-browser`
- `@azure/msal-react`
- `react-router-dom` (installed, currently not central to flow)

### Dev Dependencies
- `vite`
- `typescript`
- `@vitejs/plugin-react`
- `eslint`
- `@eslint/js`
- `typescript-eslint`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `globals`
- `@types/react`
- `@types/react-dom`
- `@types/node`

---

## 6) Backend Packages

From `backend/package.json`:

### Dependencies
- `express`
- `cors`
- `dotenv`
- `mssql`
- `jsonwebtoken`
- `jwks-rsa`
- `bcryptjs`
- `@azure/msal-node` (present in project dependencies)

### Dev Dependencies
- `typescript`
- `nodemon`
- `ts-node-dev`
- `@types/express`
- `@types/cors`
- `@types/jsonwebtoken`
- `@types/mssql`
- `@types/node`

---

## 7) Environment Variables (Backend)

Expected in `backend/.env`:

- `DB_USER`
- `DB_PASSWORD`
- `DB_SERVER`
- `DB_NAME`
- `APP_JWT_SECRET`
- `MS_CLIENT_ID`
- `MS_CLIENT_SECRET`
- `MS_TENANT_ID`
- `MS_REDIRECT_URI` (optional fallback exists in code)

---

## 8) Quick Troubleshooting

- `ERR_CONNECTION_REFUSED` on `:5001`:
  - backend server is not running or crashed
- Microsoft login fails with tenant errors:
  - check Azure supported account types and `authority` setup
- Empty dashboard after login:
  - ensure app token is in localStorage and backend accepts it
  - check `Timesheets.userId` linkage for that user

