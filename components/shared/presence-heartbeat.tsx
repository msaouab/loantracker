"use client";

import { useEffect, useRef } from "react";
import { PRESENCE_HEARTBEAT_MS } from "@/lib/presence";

/**
 * Pings /api/presence so admins can see who's currently active. Fires on mount,
 * when the tab becomes visible again, and on an interval — but only while the
 * tab is visible, so a backgrounded tab stops counting as "online". Mounted
 * once in the authenticated layout; renders nothing.
 */
export function PresenceHeartbeat() {
  const lastPing = useRef(0);

  useEffect(() => {
    const ping = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      // Guard against double-fires (mount + visibility) within one interval.
      if (now - lastPing.current < PRESENCE_HEARTBEAT_MS - 1_000) return;
      lastPing.current = now;
      // Fire-and-forget; keepalive lets it survive a navigation.
      fetch("/api/presence", { method: "POST", keepalive: true }).catch(() => {});
    };

    ping();
    const timer = setInterval(ping, PRESENCE_HEARTBEAT_MS);
    document.addEventListener("visibilitychange", ping);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", ping);
    };
  }, []);

  return null;
}
