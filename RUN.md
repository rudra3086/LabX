# LabX: transfer and run guide

This guide is for moving LabX to another Windows PC with Docker Desktop,
Node.js, npm, and Git installed.

## 1. Transfer the project

### Recommended: Git transfer

On the current PC:

```powershell
cd D:\Projects\LabX
git status
git add -A
git commit -m "Save LabX before PC transfer"
git push
```

On the new PC:

```powershell
git clone <YOUR_REPOSITORY_URL> D:\Projects\LabX
cd D:\Projects\LabX
```

Do not commit `.env`, `node_modules`, `.next`, or database passwords.

### File-copy transfer

If Git is not being used, copy the project folder to the new PC, excluding:

- `node_modules`
- `.next`
- `tsconfig.tsbuildinfo`

Keep `prisma`, `rag-api`, `app`, `components`, `lib`, `public`, and
`docker-compose.yml`.

The `storage` folder contains uploaded files. Copy it only if existing
uploaded submissions and course material must be preserved.

## 2. Install application dependencies

On the new PC:

```powershell
cd D:\Projects\LabX
npm install
npx prisma generate
```

## 3. Create the environment file

Create `D:\Projects\LabX\.env`. Do not copy a masked or stale `.env` value from
the old PC. Use a real PostgreSQL URL:

```env
DATABASE_URL="postgresql://smartlab:smartlab_dev_password@localhost:5433/smartlab?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_SESSION_TTL_HOURS="12"
APP_URL="http://localhost:3000"
STORAGE_DIR="./storage/uploads"
MAX_FILE_SIZE_MB="25"
MAX_FILES_PER_SUBMISSION="5"
EMAIL_CONFIG=""
RAG_API_URL="http://localhost:8000"
RAG_INTERNAL_TOKEN="replace-with-a-shared-internal-token"
GEMINI_API_URL="https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
GEMINI_API_KEY="replace-with-your-gemini-api-key"
GEMINI_MODEL="gemini-2.0-flash"
```

`RAG_INTERNAL_TOKEN` must match the value used by the `rag-api` Docker
service. The Gemini API key is passed to the RAG service through
`GEMINI_API_KEY`. The `.env` file is ignored by Git and must be recreated on
each PC.

## 4. Start Docker services

Start PostgreSQL, Qdrant, and the internal RAG API:

```powershell
docker compose up -d --build
docker compose ps
```

Expected services:

- `smartlab-postgres`
- `labx-qdrant`
- `labx-rag-api`

Check the RAG API:

```powershell
curl.exe http://localhost:8000/health
```

Expected response:

```json
{"status":"ok"}
```

## 5. Create or restore the database

### Fresh database

Apply all committed Prisma migrations:

```powershell
npx prisma migrate deploy
npx prisma generate
npm run db:seed
```

The seed command creates the development demo accounts and data. Do not run it
against a production database unless duplicate/demo data is intended.

### Existing database backup

On the old PC, create a PostgreSQL dump:

```powershell
docker exec smartlab-postgres pg_dump -U smartlab -d smartlab -Fc -f /tmp/labx.dump
docker cp smartlab-postgres:/tmp/labx.dump .\labx.dump
```

Copy `labx.dump` to the new PC, start the PostgreSQL container, and restore:

```powershell
docker cp .\labx.dump smartlab-postgres:/tmp/labx.dump
docker exec smartlab-postgres pg_restore -U smartlab -d smartlab --clean --if-exists /tmp/labx.dump
npx prisma generate
```

Remove the dump after confirming the restore. Database dumps can contain
password hashes and academic data.

## 6. Preserve Docker vector and model data (optional)

Copying the source folder does not copy Docker named volumes. To preserve
Qdrant vectors, either let the new PC rebuild them or export the volume before
removing the old PC.

List the volumes:

```powershell
docker volume ls
```

The LabX volumes are:

- `labx_qdrant_data`
- `smartlab_pgdata`

The PostgreSQL volume should be transferred with a database dump instead of
copying its internal files. Qdrant data can be recreated by re-indexing PDFs.

## 7. Start LabX

Development mode:

```powershell
npm run dev
```

Open:

- http://localhost:3000/login
- http://localhost:3000/faculty/ai-viva
- http://localhost:3000/student/ai-viva

Production-style local run:

```powershell
npm run build
npm start
```

## 8. Useful commands

```powershell
# Stop containers but keep data
docker compose stop

# Start existing containers
docker compose start

# Stop and remove containers, preserving named volumes
docker compose down

# Remove containers and all LabX Docker data
docker compose down -v

# View logs
docker compose logs -f postgres
docker compose logs -f rag-api

# Check Prisma schema/client
npx prisma validate
npx prisma generate

# Open Prisma Studio
npm run db:studio
```

Do not run `docker compose down -v` unless all PostgreSQL and Qdrant data is
backed up or intentionally disposable.

## 9. Disk cleanup on the old PC

After confirming the new PC works, the largest removable items are usually:

```powershell
docker system df
docker volume ls
```

Remove only data that is no longer needed. Avoid deleting the PostgreSQL,
Qdrant, or Ollama volumes before backup.
