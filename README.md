# Sportinder (Svelte 5 + Bun)

Sportinder is a Svelte 5 single-page app built with SvelteKit, Tailwind, and shadcn-svelte-style UI primitives.

## Stack

- Bun
- Svelte 5 + SvelteKit (single server for UI + API)
- Tailwind CSS
- shadcn-svelte component conventions

## Local development

```bash
bun install
bun run dev
```

App runs on `http://localhost:8080` by default.
Both the app and `/api/*` endpoints run on this same port.

## Build and preview

```bash
bun run build
bun run start
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
docker run --rm -p 3000:3000 -v $(pwd)/data:/app/data sportinder:latest
```

Then open `http://localhost:3000`.

## Community Submissions + Moderation

The SvelteKit server includes a SQLite-backed API:

- `POST /api/submissions`: public endpoint to submit a sport + matching quiz answers
- `POST /api/club-submissions`: public endpoint to submit a local club for a sport
- `GET /api/community-sports`: approved sport profiles used by recommendations
- `GET /api/sport-clubs`: approved local clubs used in nearby club display
- `GET /api/admin/submissions?status=pending`: list submissions for moderation
- `POST /api/admin/submissions/:id/review`: approve or reject a submission
- `GET /api/admin/club-submissions?status=pending`: list club submissions for moderation
- `POST /api/admin/club-submissions/:id/review`: approve or reject a club submission
- `GET /api/admin/sport-profiles`: list approved sport profiles (manage)
- `PUT /api/admin/sport-profiles/:sportName`: update approved sport profile
- `DELETE /api/admin/sport-profiles/:sportName`: delete approved sport profile (+ linked clubs)
- `GET /api/admin/sport-clubs`: list approved clubs (manage)
- `PUT /api/admin/sport-clubs/:id`: update approved club
- `DELETE /api/admin/sport-clubs/:id`: delete approved club

UI routes:

- `/submit`: form for users to submit sports and local clubs
- `/admin`: moderation panel for sports and clubs

### Environment variables

- `ADMIN_TOKEN`: required for admin API access (`x-admin-token` header)
- `SQLITE_PATH` (optional): path to SQLite database (defaults to `./data/sports.sqlite`)
- `VITE_API_BASE_URL` (optional): override frontend API base URL (use only when API is on another origin)
- `CORS_ORIGIN` (optional): CORS allow-origin for cross-origin API calls (defaults to `*`)

### Scoring rule for community sports

Community sports are scored only by comparing a quiz taker's answers to the current top-voted answer per quiz question for that sport. The score is not boosted by how many total submissions a sport has.
