# Backend Flow (Beginner Friendly)

This note explains the order of files and how they connect.

## 1) First file that runs

- `server.ts` runs first when you type `npm run dev`.
- It imports the ready-made Express app from `app.ts`.
- It connects database using `config/db.ts`.
- It starts listening on a port.

## 2) Where routes are connected

- In `app.ts`, this line connects routes:
- `app.use("/timesheet", timesheetRoutes);`
- This means all timesheet endpoints start with `/timesheet`.

## 3) Route definitions

- `routes/timesheet.routes.ts` defines:
- `GET /timesheet`
- `POST /timesheet`
- These routes call controller functions.

## 4) Controller logic

- `controllers/timesheet.controller.ts` handles actual work:
- `addTimesheet` inserts data into SQL table.
- `getTimesheets` reads data from SQL table.

## 5) Database connection

- `config/db.ts` reads environment values from `.env`.
- It creates and reuses one SQL connection pool.
- Controller functions call `connectDB()` from here.

## 6) About `app.ts`

- `app.ts` is where app setup happens (middlewares + routes).
- `server.ts` starts the app after DB connects.
- This separation is more modular and easier for beginners.

