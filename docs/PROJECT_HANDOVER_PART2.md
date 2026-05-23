# Timesheet App — Technical Handover Part 2

**Companion document:** Deep dive per dashboard page, reusable components, and **concrete API contracts** with sample JSON. Part 1 (stack, architecture, DB ERD) was delivered in chat; this file is the permanent reference in-repo.

**Base URLs (adjust for your machine):**

- API: `http://localhost:5001` (or `VITE_API_BASE_URL` in frontend)
- Auth header for protected routes: `Authorization: Bearer <app_jwt>`

---

## Table of contents

1. [How the dashboard gets data (single hook)](#1-how-the-dashboard-gets-data-single-hook)
2. [Auth pages (pre-dashboard)](#2-auth-pages-pre-dashboard)
3. [Dashboard shell & navigation](#3-dashboard-shell--navigation)
4. [Per-page reference](#4-per-page-reference)
5. [Reusable UI modules](#5-reusable-ui-modules)
6. [Complete API reference with sample payloads](#6-complete-api-reference-with-sample-payloads)
7. [cURL cheat sheet](#7-curl-cheat-sheet)

---

## 1. How the dashboard gets data (single hook)

**File:** `frontend/src/pages/dashboard/useDashboardController.ts`

**Responsibilities:**

- Holds **all** workspace UI state: `activePage`, timesheet form, org join/create, departments, task form, completion panel, selected task/employee, messages.
- Defines **API base** from `getApiBaseUrl()` (`frontend/src/config/env.ts`).
- Constants: `BASE_URL = ${API_BASE}/timesheet`, `TASK_URL = ${API_BASE}/tasks`.
- On mount (`useEffect` with `[token]`): `reloadAll()` → parallel `loadTimesheets`, `loadOrganization`, `loadWorkflowTasks`.
- **History API:** `pushState` / `popstate` syncs browser back with `activePage` (no React Router).
- **Auth failure:** `failAuth()` clears `localStorage` app keys and reloads on 401/403.

**Exported API (what every page receives as `dashboard`):**

| Property / method | Meaning |
|-------------------|---------|
| `activePage`, `setActivePage` | Current `WorkspacePage` string union |
| `data` | Timesheet rows from `GET /timesheet` |
| `overview` | `GET /organization/overview` payload |
| `workflowTasks` | `GET /tasks` |
| `selectedTaskId`, `setSelectedTaskId` | Task detail selection |
| `message`, `setMessage` | Inline error/success strings |
| `timesheet`, `setTimesheet` | Add/edit timesheet form state |
| `organization`, `setOrganization` | Create-org form state |
| `join`, `setJoin` | Join-org form state |
| `department`, `setDepartment` | Department CRUD form state |
| `taskForm`, `setTaskForm` | Create task form + files |
| `completion`, `setCompletion` | Complete-task report UI |
| `totals` | `useMemo`: pending/active/completed splits + hour sums |
| `createOrganization`, `joinOrganization`, `selectOrganization` | POST flows + `saveSessionAndRefresh` |
| `saveDepartment`, `updateDepartment`, `deleteDepartment` | Department APIs |
| `createWorkflowTask`, `runTaskAction`, `completeTask` | Task APIs |
| `saveTimesheet`, `updateTimesheet`, `deleteTimesheet` | Timesheet APIs |

**Type surface:** `frontend/src/pages/dashboard/controllerType.ts` exports:

```ts
export type DashboardController = ReturnType<typeof useDashboardController>;
```

Every `*Page.tsx` receives `dashboard: DashboardController`.

---

## 2. Auth pages (pre-dashboard)

### 2.1 `frontend/src/main.tsx`

- Imports global CSS: `./index.css`.
- If `msalEnabled && msalInstance` (from `auth/authConfig.ts`): wraps `<App />` in `<MsalProvider>`.
- Else: renders `<App msalEnabled={false} />` (local-only bundle, e.g. `VITE_AUTH_MODE=local-only` or non-secure context).

### 2.2 `frontend/src/App.tsx`

**State:** `token`, `user` from `localStorage` (`appToken`, `appUser`); MSAL `accounts`, `instance`, `inProgress`.

**Microsoft path (`AppWithMsal`):**

1. `useEffect`: if MSAL account exists and no app token yet → `acquireTokenSilent` → `POST /auth/microsoft/sync` with `Authorization: Bearer <id_token>`.
2. Response stores new `appToken` + `appUser`.
3. Loading gate: `inProgress`, `syncingMicrosoft`, `loggingOut` show a simple “Please wait” card.
4. Not logged in → `<Login ... />` with `onMicrosoftLogin={() => instance.loginRedirect(loginRequest)}`.
5. Logged in → `<MainLayout><Dashboard token user /></MainLayout>`.

**Local-only path (`AppLocalOnly`):** same storage keys, no MSAL; Login gets `msalEnabled={false}`.

### 2.3 `frontend/src/pages/Login.tsx`

**Views:** `"landing" | "login" | "register"` (local state `view`).

- **Landing:** `LandingView` — marketing-style hero + CTA to login/register.
- **Login / Register:** form posts to:
  - `POST ${API_BASE}/auth/login` or `POST ${API_BASE}/auth/register`
  - Body: login `{ email, password }`; register `{ name, email, password }` (see controller for optional org fields on register — UI may not send all).
- **Microsoft:** button calls `handleMicrosoftLogin` → `onMicrosoftLogin` (redirect).
- **Remember me:** checkbox state exists (`rememberMe`) — **not wired to persistence logic** in snippet; clarify in interview if asked.

### 2.4 `frontend/src/pages/auth/LandingView.tsx`

Static layout + preview metrics; no API calls.

### 2.5 `frontend/src/pages/auth/AuthField.tsx`

Label + children wrapper for inputs.

### 2.6 `frontend/src/auth/authConfig.ts`

- Builds `PublicClientApplication` config from `import.meta.env.VITE_*`.
- `msalEnabled = (authMode !== "local-only") && (secure context || localhost)`.
- `loginRequest.scopes`: `openid`, `profile`, `email`, `User.Read`.

---

## 3. Dashboard shell & navigation

### 3.1 `frontend/src/pages/Dashboard.tsx`

**Orchestrator:** calls `useDashboardController(token, user)` once.

**Renders:**

- `DashboardLayout` — always wraps content; passes `activePage`, `hasOrganization`, `onPageChange={setActivePage}`, etc.
- Conditionally `OrganizationTopNav` when user is in org area (not on `createTask`).
- **Page switch:** large `if (activePage === "…")` chain mapping each `WorkspacePage` to a component.

**Fallback:** If user has no org and navigated to a disallowed page, forces `OrganizationsPage`.

### 3.2 `frontend/src/pages/dashboard/DashboardLayout.tsx`

- Left **sidebar** when `!isOrganizationArea`: buttons from `workspacePages` in `utils.ts` (Overview, Tasks, Organizations, Reports, Settings).
- Main area CSS classes vary by `hasOrganization` and `activePage === "overview"`.

### 3.3 `frontend/src/pages/dashboard/OrganizationTopNav.tsx`

Horizontal tabs: Home / Employees / Departments / (Create org when on org list) / Back to dashboard. Uses `disabled={!hasOrganization}` for employees/departments.

### 3.4 `frontend/src/layout/MainLayout.tsx`

Top bar: app title, user chip, logout button. **No API calls.**

---

## 4. Per-page reference

Legend: **APIs** lists primary HTTP calls triggered from that page (via `dashboard` methods).

### `OverviewPage.tsx` — `activePage === "overview"`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Executive summary: KPI cards, task status counts, recent timesheet lines. |
| **Props** | `dashboard` only. |
| **Data used** | `data` (timesheets), `totals`, `user`, `setActivePage`. |
| **APIs** | None directly; data preloaded by hook. |
| **User flow** | Click KPI → jumps to `taskPending` / `taskProgress` / `taskCompleted` / `reports`. |

### `TasksPage.tsx` — `activePage === "tasks"`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Task hub: counts, “Create Task”, links to status sub-pages. |
| **Data** | `workflowTasks`, `user`, `totals`, `setActivePage`. |
| **APIs** | Indirect (list already in memory). |
| **User flow** | “Create Task” → `createTask`. Summary cards → `taskPending` / `taskProgress` / `taskCompleted`. |

### `TaskStatusPage.tsx` — `taskPending` \| `taskProgress` \| `taskCompleted`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Filtered list of tasks by status using `dashboard.totals.pending` / `.active` / `.completed`. |
| **Child** | `TaskCard` per item; open → `setSelectedTaskId` + `taskDetails`. |
| **APIs** | None on open; switch-org chip may call `selectOrganization` (POST `/organization/select`). |

### `TaskDetailsPage.tsx` — `activePage === "taskDetails"`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Single task: metadata, attachments, timer display, start/stop/complete for assignee. |
| **Props** | `dashboard`, `task` (selected from `workflowTasks`). |
| **Data** | `apiBase` for attachment URLs: `${apiBase}${attachment.url}` (backend serves `/uploads/...`). |
| **APIs** | `POST /tasks/:id/start`, `POST /tasks/:id/stop`, `POST /tasks/:id/complete` via `runTaskAction` / `completeTask`. |
| **Timer UI** | Client-side: `runningSeconds` from `task.startedAt` + `Date.now()`; **server** accumulates on stop/complete. |

### `TaskCreatePage.tsx` — `activePage === "createTask"`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Assign task to employee in current org; optional files. |
| **Data** | `taskForm`, `overview.employees`, `overview.organization`, `message`. |
| **APIs** | `POST /tasks` as **multipart/form-data** (`FormData`), field name `attachments` (multiple). Other fields: `title`, `description`, `assignedTo`, `priority`, `estimatedHours`, `deadlineAt`. |
| **Guard** | Button disabled if `!overview.organization`. |

### `TimesheetsPage.tsx` — `activePage === "timesheets"`

| Aspect | Detail |
|--------|--------|
| **Purpose** | CRUD simple time entries (task name + hours). |
| **APIs** | `POST /timesheet`, `PUT /timesheet/:id`, `DELETE /timesheet/:id`, reload via `reloadAll`. |

### `OrganizationsPage.tsx` — `activePage === "myOrganization"`

| Aspect | Detail |
|--------|--------|
| **Purpose** | List owned vs joined orgs; switch active org; open join panel. |
| **Components** | `JoinOrganizationCard`, org cards calling `selectOrganization` or navigate to details. |
| **APIs** | `joinOrganization` → `POST /auth/join-organization`; select → `POST /organization/select`. |

### `CreateOrganizationPage.tsx` — `activePage === "createOrganization"`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Wrapper around `CreateOrganizationCard`. |
| **APIs** | `createOrganization` → `POST /organization/create`. |

### `OrganizationDetailsPage.tsx` — `activePage === "organizationDetails"`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Read-only org profile, KPIs, department snippet, employee list. |
| **Data** | `overview` only. |
| **APIs** | None on page; relies on `loadOrganization`. |

### `DepartmentsPage.tsx` — `activePage === "departments"`

| Aspect | Detail |
|--------|--------|
| **Purpose** | List departments; CEO/manager can add/edit/delete. |
| **Data** | `user.role`, `overview`, `department` form state. |
| **APIs** | `POST /organization/departments`, `PUT /organization/departments/:id`, `DELETE /organization/departments/:id`. |

### `EmployeesPage.tsx` — `activePage === "employees"`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Select employee, show profile tiles, “Assign Task” pre-fills assignee and navigates to `createTask`. |
| **APIs** | None; uses `overview.employees`. |

### `TeamsPage.tsx` — `activePage === "teams"`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Lightweight view of first 4 departments as “teams”. |
| **APIs** | None. |

### `ReportsPage.tsx` — `activePage === "reports"`

| Aspect | Detail |
|--------|--------|
| **Purpose** | KPI-style report from `totals` + `overview.stats`. |
| **APIs** | None. |

### `SettingsPage.tsx` — `activePage === "settings"`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Show user profile fields and permission flags (read-only). |
| **APIs** | None. |

### `OrganizationForms.tsx`

| Export | Role |
|--------|------|
| `CreateOrganizationCard` | Form bound to `organization` state; `formatOrganizationId` on ID input; submit `createOrganization`. |
| `JoinOrganizationCard` | Org ID + department; submit `joinOrganization`. |

### `components.tsx`

Shared presentational pieces (`KpiCard`, `InfoTile`, `StatusRow`, etc.) — no fetch logic.

### `TaskCard.tsx`

Click opens task or switches organization via `onSwitchOrganization` if task belongs to another org.

### `utils.ts`

`workspacePages`, `allDashboardPages`, `formatOrganizationId`, `formatDuration`, `formatDate`, `formatRole`, industry/team size constants.

### `types.ts`

All shared TS interfaces: `AppUser`, `WorkflowTask`, `OrganizationOverview`, `WorkspacePage`, etc.

---

## 5. Reusable UI modules

| File | Role |
|------|------|
| `components.tsx` | KPI cards, tiles, status rows |
| `TaskCard.tsx` | Task list item with org chip + timer display |
| `OrganizationForms.tsx` | Create/join org forms |
| `OrganizationTopNav.tsx` | Org subsection tabs |
| `AuthField.tsx` | Auth input layout |

**Styling:** `frontend/src/index.css` imports `styles/index-part-01.css` … `index-part-12.css` — no component-level CSS-in-JS.

---

## 6. Complete API reference with sample payloads

All protected routes (except where noted) require:

```http
Authorization: Bearer <app_jwt>
Content-Type: application/json
```

### Auth — `backend/src/routes/auth.routes.ts`

#### `POST /auth/register`

**Handler:** `register` in `controllers/auth.controller.ts`

**Body (minimal):**

```json
{
  "name": "Bilal Asif",
  "email": "bilal@example.com",
  "password": "Str0ngPass!"
}
```

**Optional org-on-signup fields (supported by controller):** `organizationName`, `organizationId`, `industry`, `teamSize`, `department` — see controller for CEO vs join flows.

**201 response (shape):**

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "name": "Bilal Asif",
    "email": "bilal@example.com",
    "provider": "local",
    "organizationId": null,
    "organizationCode": null,
    "role": "employee",
    "department": null
  },
  "organization": null
}
```

(`organization` present when org created during register.)

**Error examples:** `400` validation, `409` duplicate email or org code taken, `500` `{ "error": "message" }`.

---

#### `POST /auth/login`

**Body:**

```json
{
  "email": "bilal@example.com",
  "password": "Str0ngPass!",
  "organizationId": "ORG-OPTIONAL"
}
```

`organizationId` optional — filters user row by `organizationCode` when provided.

**200 response:**

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "name": "Bilal Asif",
    "email": "bilal@example.com",
    "provider": "local",
    "organizationId": 2,
    "organizationCode": "ORG-WIMETRIX",
    "role": "ceo",
    "department": "Engineering"
  }
}
```

**401:** `{ "error": "Invalid credentials." }`  
**400:** Microsoft-only account without password hash.

---

#### `POST /auth/join-organization` (protected)

**Middleware:** `verifyAppToken`

**Body:**

```json
{
  "organizationId": "ORG-WIMETRIX",
  "department": "Engineering"
}
```

**200 response:**

```json
{
  "token": "<new_jwt>",
  "user": { "...updated organizationId, organizationCode, role, department..." }
}
```

**404:** org code not found. **403/401:** token issues.

---

#### `POST /auth/microsoft/sync` (Microsoft Bearer, not app JWT)

**Middleware:** `verifyMicrosoftToken` — validates **Microsoft id_token** (RS256, audience from `MS_CLIENT_ID` in `config/auth.ts`).

**Headers:**

```http
Authorization: Bearer <microsoft_id_token>
```

**200 response:**

```json
{
  "token": "<app_jwt>",
  "user": {
    "id": 3,
    "name": "Microsoft User",
    "email": "user@outlook.com",
    "provider": "microsoft",
    "organizationId": null,
    "organizationCode": null,
    "role": "employee",
    "department": null
  }
}
```

---

### Organization — `backend/src/routes/organization.routes.ts`

**Global:** `router.use(verifyAppToken)` — all routes below need app JWT.

#### `GET /organization/overview`

**200 response (no active org on user):**

```json
{
  "organization": null,
  "memberships": [],
  "ownedOrganizations": [],
  "joinedOrganizations": [],
  "departments": [],
  "employees": [],
  "stats": { "employees": 0, "departments": 0, "totalHours": 0, "activeRoles": 0 }
}
```

**200 response (active org):** includes `organization` object, `memberships[]`, `departments[]` with `employeeCount`, `employees[]`, `stats` with summed hours from `timesheets` joined to users in org.

---

#### `POST /organization/create`

**Body:**

```json
{
  "organizationName": "WiMetrix",
  "organizationId": "ORG-WIMETRIX",
  "industry": "Technology",
  "teamSize": "11-50"
}
```

**201 response:**

```json
{
  "token": "<new_jwt_with_ceo>",
  "user": { "... role ceo, organizationId set ..." },
  "organization": {
    "id": 1,
    "orgCode": "ORG-WIMETRIX",
    "name": "WiMetrix",
    "companyEmail": "...",
    "industry": "Technology",
    "teamSize": "11-50"
  }
}
```

---

#### `POST /organization/select`

**Body:**

```json
{ "organizationId": "ORG-WIMETRIX" }
```

`organizationId` can be numeric id or org code string.

**200:** `{ "token": "<jwt>", "user": { ... } }`  
**403:** not a member.

---

#### `POST /organization/departments`

**RBAC:** `department.controller.ts` — only `ceo` or `manager` (`isOrganizationAdmin`).

**Body:**

```json
{ "name": "Engineering", "description": "Product engineering" }
```

**201:** `{ "department": { "id": 1, "name": "...", "description": "...", "createdAt": "..." } }`

---

#### `PUT /organization/departments/:id`

**Body:**

```json
{ "name": "Engineering", "description": "Updated" }
```

**200:** `{ "department": { ... } }`  
**404:** wrong id / wrong org.

---

#### `DELETE /organization/departments/:id`

**200:** `{ "message": "Department deleted." }`

---

### Timesheets — `backend/src/routes/timesheet.routes.ts`

Mounted at **`/timesheet`** in `server.ts` (not `/timesheets`).

#### `GET /timesheet`

**200:** array of rows:

```json
[
  { "id": 10, "task": "Client meeting", "hours": 2, "userId": 1 }
]
```

---

#### `POST /timesheet`

**Body:**

```json
{ "task": "Client meeting", "hours": 2 }
```

**200:** `{ "message": "Timesheet added successfully" }`

---

#### `PUT /timesheet/:id`

**Body:**

```json
{ "task": "Updated title", "hours": 3 }
```

**200:** `{ "message": "Timesheet updated" }`  
Only rows where `"userId"` matches JWT user.

---

#### `DELETE /timesheet/:id`

**200:** `{ "message": "Timesheet deleted" }`

---

### Tasks — `backend/src/routes/task.routes.ts`

Base path: **`/tasks`**.

#### `GET /tasks`

**200:** JSON array of task objects (see `toTaskResponse` in `controllers/taskSql.ts`):

```json
[
  {
    "id": 1,
    "title": "Design review",
    "description": null,
    "priority": "medium",
    "status": "pending",
    "estimatedHours": "4",
    "deadlineAt": null,
    "startedAt": null,
    "totalSeconds": 0,
    "completionReport": null,
    "blockers": null,
    "submittedAt": null,
    "createdAt": "2026-05-20T10:00:00.000Z",
    "organization": { "id": 1, "name": "WiMetrix", "orgCode": "ORG-WIMETRIX" },
    "assignedBy": { "id": 2, "name": "Manager", "email": "m@example.com" },
    "assignedTo": { "id": 1, "name": "You", "email": "you@example.com", "department": "Engineering" },
    "attachments": [
      { "id": 1, "originalName": "spec.pdf", "mimeType": "application/pdf", "size": 12000, "url": "/uploads/tasks/1234-spec.pdf" }
    ]
  }
]
```

---

#### `POST /tasks`

**Content-Type:** `multipart/form-data` (browser sets boundary).

**Fields:** `title`, `description`, `assignedTo` (user id string), `priority`, `estimatedHours`, `deadlineAt`, files under `attachments` (max 8, 25MB each).

**201:**

```json
{
  "task": { "...single task object..." }
}
```

**400:** missing title/assignee, assignee not in org, etc.

---

#### `POST /tasks/:id/start`

**200:** `{ "message": "Task timer started." }`  
**404:** not assignee, wrong org, or already completed.

---

#### `POST /tasks/:id/stop`

**200:** `{ "message": "Task timer stopped." }`

---

#### `POST /tasks/:id/complete`

**Body:**

```json
{
  "completionReport": "Implemented feature X and tested.",
  "blockers": "Waiting on API keys (optional)"
}
```

**200:** `{ "message": "Task completed." }`  
**400:** missing `completionReport`.

---

## 7. cURL cheat sheet

Replace `TOKEN` and host as needed.

```bash
# Login
curl -s -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpass"}'

# Overview (protected)
curl -s http://localhost:5001/organization/overview \
  -H "Authorization: Bearer TOKEN"

# List tasks
curl -s http://localhost:5001/tasks \
  -H "Authorization: Bearer TOKEN"

# Add timesheet
curl -s -X POST http://localhost:5001/timesheet \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"task":"Meeting","hours":1}'
```

---

## Document maintenance

When you add a new `WorkspacePage` in `types.ts`:

1. Add handling in `Dashboard.tsx`.
2. Add any new `fetch`/`postJson` helpers in `useDashboardController.ts`.
3. Add backend route + controller if new API.
4. Update this file’s **Section 4** and **Section 6**.

---

*Generated for the Timesheet monorepo. Paths relative to repository root.*
