# Local PostgreSQL + Docker Deployment Setup

This project now supports two database modes:

1. Local Mac development uses native PostgreSQL installed on macOS.
2. Docker/EC2 deployment uses PostgreSQL from `docker-compose.yml`.

## Local Mac Development

Install and start PostgreSQL natively on your Mac:

```bash
brew install postgresql@16
brew services start postgresql@16
```

Create the database and user that match `backend/.env`:

```bash
createdb timesheet
```

If your local PostgreSQL user/password is different, update these values in `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=timesheet
DB_USER=postgres
DB_PASSWORD=postgres
```

Then run the app separately for local development:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

## Docker / EC2 Deployment

For deployment, run everything together from the repo root:

```bash
docker compose up --build
```

Docker Compose starts:

- `postgres` container on PostgreSQL 16
- `backend` container on port 5001
- `frontend` container on port 80 through Nginx

Inside Docker, the backend connects to:

```env
DB_HOST=postgres
```

That host name only works inside Docker Compose because `postgres` is the service name.

## Important Rule

Use `localhost` for native Mac PostgreSQL.

Use `postgres` for Docker Compose PostgreSQL.

The backend code does not need to change between both modes. Only environment variables change.
