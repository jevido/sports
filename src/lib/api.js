const rawApiBase = (import.meta.env.VITE_API_BASE_URL || "").trim();

function normalizeBase(base) {
  return base.replace(/\/+$/, "");
}

export function getApiBase() {
  return rawApiBase ? normalizeBase(rawApiBase) : "";
}

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBase()}${normalizedPath}`;
}

export function apiFetch(path, init) {
  return fetch(apiUrl(path), init);
}
