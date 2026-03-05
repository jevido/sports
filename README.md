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
