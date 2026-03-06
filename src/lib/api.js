const rawApiBase = (import.meta.env.VITE_API_BASE_URL || "").trim();

function normalizeBase(base) {
  return base.replace(/\/+$/, "");
}

export function getApiBase() {
  if (rawApiBase) return normalizeBase(rawApiBase);

  if (typeof window !== "undefined" && window.location.port === "8080") {
    return "http://127.0.0.1:3001";
  }

  return "";
}

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBase()}${normalizedPath}`;
}

export function apiFetch(path, init) {
  return fetch(apiUrl(path), init);
}
