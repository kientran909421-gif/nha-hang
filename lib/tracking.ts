"use client";

export const trackingEventNames = [
  "page_view",
  "booking_start",
  "booking_complete",
  "call_click",
  "directions_click",
  "menu_item_view",
] as const;

export type TrackingEventName = (typeof trackingEventNames)[number];

const sessionStorageKey = "restaurant_tracking_session_id";

function getSessionId() {
  const existing = window.sessionStorage.getItem(sessionStorageKey);
  if (existing) return existing;

  const sessionId =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(sessionStorageKey, sessionId);
  return sessionId;
}

export function track(
  name: TrackingEventName,
  details: { path?: string; utmSource?: string } = {},
) {
  if (typeof window === "undefined" || window.location.pathname.startsWith("/admin")) {
    return;
  }

  const path = details.path ?? window.location.pathname;
  const utmSource =
    details.utmSource ??
    new URLSearchParams(window.location.search).get("utm_source") ??
    "";
  const body = JSON.stringify({
    name,
    path,
    utm_source: utmSource,
    session_id: getSessionId(),
  });

  const endpoint = "/api/track";
  if (typeof navigator.sendBeacon === "function") {
    const queued = navigator.sendBeacon(
      endpoint,
      new Blob([body], { type: "application/json" }),
    );
    if (queued) return;
  }

  void fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
