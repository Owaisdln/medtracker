import { useEffect, useRef } from "react";

/**
 * Maps preset time-of-day labels → actual clock times.
 * These are the defaults for named slots.
 */
const PRESET_TIME_MAP = {
  Morning:   { hour: 8,  minute: 0 },
  Afternoon: { hour: 13, minute: 0 },
  Evening:   { hour: 18, minute: 0 },
  Night:     { hour: 21, minute: 0 },
};

/**
 * Resolves a time label to { hour, minute } or null.
 * Handles both preset labels ("Morning") and custom "HH:MM" strings.
 */
function resolveTime(timeLabel) {
  if (PRESET_TIME_MAP[timeLabel]) return PRESET_TIME_MAP[timeLabel];

  // Parse custom "HH:MM" format
  const match = timeLabel.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }

  return null; // unrecognised — skip
}

/**
 * Schedules browser notifications for each un-logged medication dose today.
 *
 * @param {Array} medications - list of medication objects
 * @param {Array} logs        - today's dose logs
 */
export function useNotifications(medications, logs) {
  const timersRef = useRef([]);

  /* ── Request permission once on mount ── */
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  /* ── Schedule / reschedule timers whenever data changes ── */
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    // Cancel any previously scheduled timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const now = new Date();

    medications.forEach((med) => {
      (med.times || []).forEach((timeLabel) => {
        const resolved = resolveTime(timeLabel);
        if (!resolved) return;

        // Skip if this dose is already logged today
        const alreadyLogged = logs.some(
          (l) => l.medicationId === med.id && l.time === timeLabel
        );
        if (alreadyLogged) return;

        // Compute ms until the scheduled time today
        const target = new Date();
        target.setHours(resolved.hour, resolved.minute, 0, 0);
        const msUntil = target.getTime() - now.getTime();

        if (msUntil <= 0) return; // already passed today

        const timer = setTimeout(() => {
          try {
            new Notification("MedTracker — Dose Reminder", {
              body: `Time to take ${med.name} (${med.dose}) — ${timeLabel}`,
              icon: "/favicon.svg",
              badge: "/favicon.svg",
              tag: `${med.id}-${timeLabel}-${new Date().toDateString()}`,
              requireInteraction: true,
            });
          } catch (_) {
            // Fail silently if Notification constructor throws
          }
        }, msUntil);

        timersRef.current.push(timer);
      });
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [medications, logs]);
}
