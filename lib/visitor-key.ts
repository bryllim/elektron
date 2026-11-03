/** The visitor's own Meta Model API key, kept only in this browser's localStorage and sent to Elektron's own API routes. */
const STORAGE = "elektron-meta-key";
export const META_KEY_EVENT = "elektron-meta-key";

export function visitorKey() {
  try { return localStorage.getItem(STORAGE)?.trim() || ""; } catch { return ""; }
}
export function setVisitorKey(key: string) {
  try {
    if (key.trim()) localStorage.setItem(STORAGE, key.trim());
    else localStorage.removeItem(STORAGE);
  } catch {}
  window.dispatchEvent(new Event(META_KEY_EVENT));
}
/** Headers to add to requests to /api/agent, /api/meta/check and /api/inspection. */
export function metaKeyHeaders(): Record<string, string> {
  const key = visitorKey();
  return key ? { "x-meta-key": key } : {};
}
