import { extname, join, normalize } from "node:path";

const root = join(import.meta.dir, "build");

const isSafePath = (requestedPath) => {
  const normalized = normalize(requestedPath).replace(/^\/+/, "");
  return !normalized.startsWith("..") && !normalized.includes("..\\");
};

const resolveFile = (pathname) => {
  const requested = pathname === "/" ? "/index.html" : pathname;
  if (!isSafePath(requested)) return null;
  return join(root, requested);
};

Bun.serve({
  port: Number(Bun.env.PORT ?? 3000),
  fetch(req) {
    const url = new URL(req.url);
    const filePath = resolveFile(decodeURIComponent(url.pathname));

    if (filePath && Bun.file(filePath).size > 0) {
      return new Response(Bun.file(filePath));
    }

    if (extname(url.pathname)) {
      return new Response("Not Found", { status: 404 });
    }

    return new Response(Bun.file(join(root, "index.html")));
  }
});

console.log(`Sportinder running on http://0.0.0.0:${Number(Bun.env.PORT ?? 3000)}`);
