import { useEffect, useRef } from "react";

/**
 * Maps the time-of-day label to a clock hour (24h).
 * Adjust these to match your preferred reminder times.
 */
const TIME_MAP = {
  Morning:   { hour: 8,  minute: 0 },
  Afternoon: { hour: 13, minute: 0 },
  Evening:   { hour: 18, minute: 0 },
  Night:     { hour: 21, minute: 0 },
};

/**
 * Schedules browser notifications for each un-logged medication dose today.
 *
 * @param {Array}  medications  - list of medication objects from Firestore
 * @param {Array}  logs         - today's dose logs from Firestore
 */
export function useNotifications(medications, logs) {
  const timersRef = useRef([]);

  /* ── Step 1: request permission once on mount ── */
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  /* ── Step 2: (re)schedule timers whenever meds or logs change ── */
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    // Clear any previously scheduled timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const now = new Date();

    medications.forEach((med) => {
      med.times.forEach((timeLabel) => {
        const schedule = TIME_MAP[timeLabel];
        if (!schedule) return;

        // Skip if this dose is already logged today
        const alreadyLogged = logs.some(
          (l) => l.medicationId === med.id && l.time === timeLabel
        );
        if (alreadyLogged) return;

        // Calculate milliseconds until this time today
        const target = new Date();
        target.setHours(schedule.hour, schedule.minute, 0, 0);
        const msUntil = target.getTime() - now.getTime();

        // Skip if the time has already passed today
        if (msUntil <= 0) return;

        const timer = setTimeout(() => {
          try {
            new Notification("MedTracker — Dose Reminder", {
              body: `Time to take ${med.name} (${med.dose}) — ${timeLabel}`,
              icon: "/favicon.svg",
              badge: "/favicon.svg",
              // Unique tag prevents duplicate notifications for the same dose
              tag: `${med.id}-${timeLabel}-${new Date().toDateString()}`,
              requireInteraction: true, // stays until dismissed
            });
          } catch (_) {
            // Notification constructor can throw in some browsers — fail silently
          }
        }, msUntil);

        timersRef.current.push(timer);
      });
    });

    // Cleanup on unmount or re-run
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [medications, logs]);
}
