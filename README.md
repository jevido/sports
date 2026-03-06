# Sportinder (Svelte 5 + Bun)

Sportinder is a Svelte 5 single-page app built with SvelteKit, Tailwind, and shadcn-svelte-style UI primitives.

## Stack

- Bun
- Svelte 5 + SvelteKit (static SPA output)
- Tailwind CSS
- shadcn-svelte component conventions

## Local development

```bash
bun install
bun run dev
```

App runs on `http://localhost:8080` by default.
The dev command also starts the Bun API server on `http://localhost:3001`.
Frontend requests go directly to that API in development.

If you prefer separate terminals:

```bash
bun run dev:api
bun run dev:web
```

## Build and preview

```bash
bun run build
bun run preview
```

## Type checks

```bash
bun run check
```

## Docker (production)

Build image:

```bash
docker build -t sportinder:latest .
```

Run container:

```bash
docker run --rm -p 3000:3000 sportinder:latest
```

Then open `http://localhost:3000`.

## Community Submissions + Moderation

The Bun server now includes a SQLite-backed API:

- `POST /api/submissions`: public endpoint to submit a sport + matching quiz answers
- `POST /api/club-submissions`: public endpoint to submit a local club for a sport
- `GET /api/community-sports`: approved sport profiles used by recommendations
- `GET /api/sport-clubs`: approved local clubs used in nearby club display
- `GET /api/admin/submissions?status=pending`: list submissions for moderation
- `POST /api/admin/submissions/:id/review`: approve or reject a submission
- `GET /api/admin/club-submissions?status=pending`: list club submissions for moderation
- `POST /api/admin/club-submissions/:id/review`: approve or reject a club submission

UI routes:

- `/submit`: form for users to submit sports and local clubs
- `/admin`: moderation panel for sports and clubs

### Environment variables

- `ADMIN_TOKEN`: required for admin API access (`x-admin-token` header)
- `SQLITE_PATH` (optional): path to SQLite database (defaults to `./data/sports.sqlite`)
- `VITE_API_BASE_URL` (optional): override frontend API base URL (for dev/staging)
- `CORS_ORIGIN` (optional): set API CORS allow-origin (defaults to `*`)

### Scoring rule for community sports

Community sports are scored only by comparing a quiz taker's answers to the current top-voted answer per quiz question for that sport. The score is not boosted by how many total submissions a sport has.
