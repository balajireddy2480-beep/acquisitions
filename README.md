# Acquisitions

Node.js API service backed by Neon Postgres and Drizzle.

## Database Modes

This app switches database behavior with environment variables:

| Environment | Compose file              | Database target                | Key variables                                                                      |
| ----------- | ------------------------- | ------------------------------ | ---------------------------------------------------------------------------------- |
| Development | `docker-compose.dev.yml`  | Neon Local proxy               | `DATABASE_URL=postgres://neon:npg@neon-local:5432/acquisitions`, `NEON_LOCAL=true` |
| Production  | `docker-compose.prod.yml` | Neon Cloud serverless Postgres | `DATABASE_URL=postgres://...neon.tech...`, `NEON_LOCAL=false`                      |

The code uses `@neondatabase/serverless`. In development, `NEON_LOCAL=true` configures the driver to send HTTP queries to `NEON_LOCAL_FETCH_ENDPOINT`. In production, that override is disabled and the regular Neon Cloud URL is used directly.

## Local Development With Neon Local

Neon Local is a Docker proxy for a Neon Cloud project. It creates an ephemeral branch when the container starts and deletes that branch when the container stops, so each compose environment can get a fresh database branch for development or testing.

Reference: [Neon Local documentation](https://neon.com/docs/local/neon-local).

1. Create or update `.env.development`:

   ```env
   PORT=5000
   NODE_ENV=development
   LOG_LEVEL=debug
   JWT_SECRET=dev-only-change-me
   ARCJET_KEY=

   DATABASE_URL=postgres://neon:npg@neon-local:5432/acquisitions
   NEON_LOCAL=true
   NEON_LOCAL_FETCH_ENDPOINT=http://neon-local:5432/sql

   NEON_API_KEY=your-neon-api-key
   NEON_PROJECT_ID=your-neon-project-id
   # PARENT_BRANCH_ID=br-your-parent-branch-id
   ```

2. Start the stack:

   ```sh
   npm run docker
   ```

   `npm run run:docker` and `npm run docker:dev` are aliases for the same development stack.

3. Open the API:

   ```sh
   curl http://localhost:5000/health
   ```

4. Run migrations against the ephemeral branch when needed:

   ```sh
   docker compose -f docker-compose.dev.yml exec app npm run db:migrate
   ```

To create an isolated ephemeral branch for a test run, use a different compose project name:

```sh
docker compose -p acquisitions-test -f docker-compose.dev.yml up --build
```

## Production With Neon Cloud

Production does not run the Neon Local proxy. Neon Cloud is the external serverless database, and the app receives its connection string through environment variables.

1. Create or inject `.env.production`:

   ```env
   PORT=5000
   NODE_ENV=production
   LOG_LEVEL=info
   JWT_SECRET=replace-with-a-strong-secret
   ARCJET_KEY=replace-if-used

   DATABASE_URL=postgres://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
   NEON_LOCAL=false
   ```

2. Start the production container:

   ```sh
   npm run docker:prod
   ```

3. Run production migrations as a release step:

   ```sh
   npm run docker:migrate:prod
   ```

In managed deployment platforms, use the production image target from `Dockerfile` and inject `DATABASE_URL`, `JWT_SECRET`, and other secrets through the platform secret manager instead of committing them.

## Docker Files

- `Dockerfile` contains a development target with file watching and a production target with only runtime dependencies.
- `docker-compose.dev.yml` runs the app with `neondatabase/neon_local:latest`.
- `docker-compose.prod.yml` runs only the app because the Neon production database is serverless and external.
- `setup-docker.sh` wraps the common compose commands used by the npm `docker:*` scripts.
- `.env.development` and `.env.production` are ignored by git; commit the `.example` files instead.
