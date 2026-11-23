/**
 * Urban Run - Remote Kill Switch ("Instant Check When Online + 1-Day Short Offline Pass")
 *
 * Rules:
 * 1. Online (`navigator.onLine === true`):
 *    - Always checks `./version.json?hb=<timestamp>` (no-store, zero throttle) on launch,
 *      background resume (`visibilitychange`), and reconnect (`online`).
 *    - Allows normal hosting redirects and cold-start wakeups (12s timeout + 1 retry),
 *      then strictly validates HTTP 200 on the same origin with valid JSON explicitly
 *      containing `{ active: true, killSwitch: false, discontinued: false }`.
 *    - If valid: clears any stale lock, updates `last_verified_online_at`, and allows play.
 *    - If unpublished (401/403/404/410, cross-origin/login redirect, HTML error page,
 *      invalid JSON, explicit kill flag, or unreachable after retry while online):
 *      immediately triggers full wipe & permanent lockout screen.
 *
 * 2. Offline (`navigator.onLine === false`):
 *    - If locked, stays permanently blocked and wiped.
 *    - Otherwise allows smooth cached offline gameplay for up to 1 day (24 hours)
 *      from `last_verified_online_at` (with 10-minute clock rollback protection).
 *    - Once expired, immediately triggers full wipe & permanent lockout.
 */

import { sounds } from '../utils/audio';

export const STORAGE_KEYS = {
  LAST_VERIFIED_ONLINE_AT: 'last_verified_online_at',
  DISCONTINUED_LOCK: 'urban_run_discontinued',
  LEGACY_DECOMMISSIONED_LOCK: 'urban_run_decommissioned',
} as const;

export const OFFLINE_PASS_DURATION_MS = 24 * 60 * 60 * 1000; // 1 Day (24 Hours)
export const CLOCK_ROLLBACK_TOLERANCE_MS = 10 * 60 * 1000; // 10 Minutes
export const ONLINE_CHECK_TIMEOUT_MS = 12_000; // 12 Seconds (handles Cloud Run cold starts)
export const STATUS_ENDPOINT = './version.json';

interface StatusPayload {
  active?: unknown;
  killSwitch?: unknown;
  discontinued?: unknown;
}

export interface KillSwitchCheckResult {
  allowed: boolean;
  discontinued: boolean;
}

const teardownCallbacks = new Set<() => void>();
let onVerifiedActiveCallback: (() => void) | null = null;

let isDiscontinuedInMemory = false;
let wipeExecuted = false;
let inFlightCheck: Promise<KillSwitchCheckResult> | null = null;

function safeGetStorage(key: string): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorage(key: string, value: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota or sandbox errors
  }
}

function safeRemoveStorage(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

function parseTimestamp(raw: string | null): number | null {
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Registers a runtime teardown handler (e.g., cancelling animation frames or timers)
 * that executes synchronously when the kill switch triggers.
 */
export function registerTeardownCallback(callback: () => void): () => void {
  teardownCallbacks.add(callback);
  return () => {
    teardownCallbacks.delete(callback);
  };
}

/**
 * Registers a callback invoked whenever an online check verifies the app is live
 * (used to ensure the PWA Service Worker is registered if previously skipped by a stale lock).
 */
export function setOnVerifiedActiveCallback(callback: () => void): void {
  onVerifiedActiveCallback = callback;
}

/**
 * Synchronous check for whether the kill-switch lock flag is currently saved locally.
 */
export function isKillSwitchLocked(): boolean {
  if (isDiscontinuedInMemory) return true;
  const lockFlag = safeGetStorage(STORAGE_KEYS.DISCONTINUED_LOCK);
  const legacyLockFlag = safeGetStorage(STORAGE_KEYS.LEGACY_DECOMMISSIONED_LOCK);
  if (lockFlag === 'true' || legacyLockFlag === 'true') {
    isDiscontinuedInMemory = true;
    return true;
  }
  return false;
}

/**
 * Clears any stale lock flags once the live origin server explicitly confirms active status.
 */
function clearKillSwitchLock(): void {
  isDiscontinuedInMemory = false;
  wipeExecuted = false;
  safeRemoveStorage(STORAGE_KEYS.DISCONTINUED_LOCK);
  safeRemoveStorage(STORAGE_KEYS.LEGACY_DECOMMISSIONED_LOCK);
}

/**
 * Evaluates whether offline gameplay is currently permitted under the 1-Day Short Offline Pass.
 */
export function isOfflinePassValid(): boolean {
  if (isKillSwitchLocked()) return false;

  const lastVerified = parseTimestamp(safeGetStorage(STORAGE_KEYS.LAST_VERIFIED_ONLINE_AT));
  if (lastVerified === null) {
    return false;
  }

  const now = Date.now();

  // Reject significant backward device clock rollback
  if (now < lastVerified - CLOCK_ROLLBACK_TOLERANCE_MS) {
    return false;
  }

  // Reject if the 1-day offline pass window has elapsed
  if (now - lastVerified > OFFLINE_PASS_DURATION_MS) {
    return false;
  }

  return true;
}

/**
 * Full Wipe & Permanent Lockout:
 * - Suspends Web AudioContext & cancels all registered game loops/timers
 * - Clears localStorage (re-persisting ONLY the discontinued lock flag), sessionStorage, and IndexedDB
 * - Unregisters all Service Workers
 * - Deletes all Cache Storage entries
 */
export async function triggerKillSwitchAndWipe(): Promise<void> {
  isDiscontinuedInMemory = true;

  // 1. Immediately halt audio and active gameplay animation loops/timers
  try {
    sounds.suspend();
  } catch {
    // Ignore audio teardown errors
  }

  teardownCallbacks.forEach((cb) => {
    try {
      cb();
    } catch {
      // Ignore individual teardown errors
    }
  });

  if (wipeExecuted) {
    safeSetStorage(STORAGE_KEYS.DISCONTINUED_LOCK, 'true');
    return;
  }
  wipeExecuted = true;

  // 2. Wipe localStorage & sessionStorage completely, then persist ONLY the kill lock flag
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
      window.localStorage.setItem(STORAGE_KEYS.DISCONTINUED_LOCK, 'true');
    }
  } catch {
    // Ignore storage access errors
  }

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  } catch {
    // Ignore
  }

  // 3. Delete all IndexedDB databases
  try {
    if (typeof window !== 'undefined' && window.indexedDB) {
      if (typeof window.indexedDB.databases === 'function') {
        const dbs = await window.indexedDB.databases();
        await Promise.all(
          dbs.map((db) => {
            if (!db.name) return Promise.resolve();
            return new Promise<void>((resolve) => {
              const req = window.indexedDB.deleteDatabase(db.name as string);
              req.onsuccess = () => resolve();
              req.onerror = () => resolve();
              req.onblocked = () => resolve();
            });
          })
        );
      }
    }
  } catch {
    // Ignore IndexedDB errors
  }

  // 4. Unregister all active Service Workers
  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }
  } catch {
    // Ignore Service Worker unregister errors
  }

  // 5. Purge all Cache Storage entries
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
    }
  } catch {
    // Ignore Cache API errors
  }

  // Re-assert lock flag after async teardown
  safeSetStorage(STORAGE_KEYS.DISCONTINUED_LOCK, 'true');
}

/**
 * Validates an online response from `./version.json`.
 * Allows normal same-origin hosting redirects, then strictly requires HTTP 200
 * on the same origin whose body parses as valid JSON explicitly containing
 * `{ active: true, killSwitch: false, discontinued: false }`.
 * (Unpublished pages, 401/403/404/410, login redirects, and HTML error pages all fail.)
 */
async function isValidActiveResponse(response: Response): Promise<boolean> {
  if (response.status !== 200) {
    return false;
  }

  // Reject cross-origin redirects (e.g., redirect to an external sign-in or error domain)
  if (response.url && typeof window !== 'undefined') {
    try {
      const resolvedUrl = new URL(response.url, window.location.origin);
      if (resolvedUrl.origin !== window.location.origin) {
        return false;
      }
    } catch {
      return false;
    }
  }

  // Reject explicit kill-switch headers
  const killHeader =
    response.headers.get('x-kill-switch') ||
    response.headers.get('x-urban-run-decommissioned');
  if (killHeader && killHeader.toLowerCase() === 'true') {
    return false;
  }

  // Parse body text as JSON — HTML error/login pages or invalid payloads fail here
  try {
    const rawText = await response.text();
    const trimmed = rawText.trim();
    if (!trimmed.startsWith('{')) {
      return false;
    }
    const data = JSON.parse(trimmed) as StatusPayload;
    if (!data || typeof data !== 'object') {
      return false;
    }
    return (
      data.active === true &&
      data.killSwitch === false &&
      data.discontinued === false
    );
  } catch {
    return false;
  }
}

/**
 * Single fetch attempt against `./version.json` with cache-busting and timeout.
 */
async function fetchStatusOnce(): Promise<{
  ok: boolean;
  shouldRetry: boolean;
}> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), ONLINE_CHECK_TIMEOUT_MS);

  try {
    const url = `${STATUS_ENDPOINT}?hb=${Date.now()}`;
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
      signal: controller.signal,
    });

    window.clearTimeout(timeoutId);

    // Explicit unpublish / unauthorized / gone responses should NOT be retried
    if (
      response.status === 401 ||
      response.status === 403 ||
      response.status === 404 ||
      response.status === 410
    ) {
      return { ok: false, shouldRetry: false };
    }

    // Transient 5xx (e.g., cold start warmup) gets 1 retry
    if (response.status >= 500) {
      return { ok: false, shouldRetry: true };
    }

    const valid = await isValidActiveResponse(response);
    return { ok: valid, shouldRetry: false };
  } catch {
    window.clearTimeout(timeoutId);
    // Network blip or cold-start timeout -> allow 1 retry
    return { ok: false, shouldRetry: true };
  }
}

/**
 * Runs the "Instant Check When Online + 1-Day Short Offline Pass" verification.
 * Online mode always verifies against the live server first (so a freshly published
 * app overrides any stale local lock, while an unpublished app immediately wipes & locks).
 */
export async function evaluateKillSwitch(): Promise<KillSwitchCheckResult> {
  if (inFlightCheck) {
    return inFlightCheck;
  }

  const runCheck = async (): Promise<KillSwitchCheckResult> => {
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // 1. Offline Mode -> Respect existing lock & enforce 1-Day Short Offline Pass
    if (!online) {
      if (!isKillSwitchLocked() && isOfflinePassValid()) {
        return { allowed: true, discontinued: false };
      }
      await triggerKillSwitchAndWipe();
      return { allowed: false, discontinued: true };
    }

    // 2. Online Mode -> Always verify live server first (with 1 retry for cold starts)
    let attempt = await fetchStatusOnce();
    if (!attempt.ok && attempt.shouldRetry) {
      await delay(800);
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        if (!isKillSwitchLocked() && isOfflinePassValid()) {
          return { allowed: true, discontinued: false };
        }
        await triggerKillSwitchAndWipe();
        return { allowed: false, discontinued: true };
      }
      attempt = await fetchStatusOnce();
    }

    if (attempt.ok) {
      clearKillSwitchLock();
      safeSetStorage(STORAGE_KEYS.LAST_VERIFIED_ONLINE_AT, String(Date.now()));
      try {
        onVerifiedActiveCallback?.();
      } catch {
        // Ignore SW hook errors
      }
      return { allowed: true, discontinued: false };
    }

    // If connectivity dropped mid-request and browser now reports offline, check 1-Day Offline Pass
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      if (!isKillSwitchLocked() && isOfflinePassValid()) {
        return { allowed: true, discontinued: false };
      }
    }

    // Unpublished / invalid / unreachable while online -> immediate full wipe & permanent lockout
    await triggerKillSwitchAndWipe();
    return { allowed: false, discontinued: true };
  };

  inFlightCheck = runCheck().finally(() => {
    inFlightCheck = null;
  });

  return inFlightCheck;
}
