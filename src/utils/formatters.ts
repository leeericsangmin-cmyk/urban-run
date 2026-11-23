/**
 * Time formatting helpers for survival duration scoring.
 */

/**
 * Formats duration with tenths of a second for Game Over modal.
 * Examples:
 *   - 42.34 -> "42.3s"
 *   - 84.56 -> "1m 24.5s"
 *   - 140.0 -> "2m 20.0s"
 */
export function formatDurationPrecise(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '0.0s';
  const totalTenths = Math.floor(totalSeconds * 10);
  const mins = Math.floor(totalTenths / 600);
  const secs = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;
  if (mins > 0) {
    return `${mins}m ${secs.toString().padStart(2, '0')}.${tenths}s`;
  }
  return `${secs}.${tenths}s`;
}

/**
 * Formats seconds in clock style (MM:SS) for HUD.
 * Examples:
 *   - 42.8 -> "00:42"
 *   - 84.2 -> "01:24"
 */
export function formatDurationClock(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const s = Math.floor(totalSeconds);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats seconds in short text form (e.g. 1m 24s, or 42s).
 */
export function formatDuration(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '0s';
  const s = Math.floor(totalSeconds);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins > 0) {
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${secs}s`;
}
