import { DifficultyLevel } from '../types/game';

/**
 * Zero-PII Local Storage Manager (ePrivacy, GDPR Article 5(3), COPPA compliant).
 *
 * Rules:
 * 1. Exclusively uses window.localStorage on the user's local device.
 * 2. Only stores raw numerical scores keyed strictly by difficulty ('sketch_run_hs_easy', 'sketch_run_hs_normal', 'sketch_run_hs_hard').
 * 3. Never generates, assigns, or stores UUIDs, pseudo-IDs, hardware timestamps, device fingerprints, or IP logs.
 * 4. Zero network communication of user metrics or analytics.
 */

export const SCORE_KEYS: Record<DifficultyLevel, string> = {
  easy: 'sketch_run_hs_easy',
  normal: 'sketch_run_hs_normal',
  hard: 'sketch_run_hs_hard',
};

export const DIFFICULTY_PREF_KEY = 'sketch_run_difficulty';

function sanitizeScore(value: unknown): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || isNaN(value)) return 0;
    return Math.max(0, Math.min(Math.floor(value), 999999999));
  }
  if (typeof value === 'string') {
    // Strip everything except pure digits
    const cleaned = value.trim().replace(/[^\d]/g, '');
    if (!cleaned) return 0;
    const parsed = parseInt(cleaned, 10);
    if (!Number.isFinite(parsed) || isNaN(parsed)) return 0;
    return Math.max(0, Math.min(parsed, 999999999));
  }
  return 0;
}

export function getHighScore(difficulty: DifficultyLevel): number {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  try {
    const key = SCORE_KEYS[difficulty];
    if (!key) return 0;
    const val = localStorage.getItem(key);
    if (val !== null) {
      return sanitizeScore(val);
    }

    // Gracefully migrate legacy keys if previously stored under old names
    const legacyKey1 = `sketch_run_high_score_midtown_${difficulty}`;
    const legacyKey2 = `sketch_run_high_score_midtown`;
    const legacyVal = localStorage.getItem(legacyKey1) || (difficulty === 'normal' ? localStorage.getItem(legacyKey2) : null);
    if (legacyVal !== null) {
      const sanitized = sanitizeScore(legacyVal);
      localStorage.setItem(key, sanitized.toString());
      localStorage.removeItem(legacyKey1);
      localStorage.removeItem(legacyKey2);
      return sanitized;
    }
  } catch {
    // Local storage may be restricted in sandbox
  }
  return 0;
}

export function saveHighScore(difficulty: DifficultyLevel, score: number): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const key = SCORE_KEYS[difficulty];
    if (!key) return false;
    const pureNumericScore = sanitizeScore(score);
    localStorage.setItem(key, pureNumericScore.toString());
    return true;
  } catch {
    return false;
  }
}

export function getSavedDifficulty(): DifficultyLevel {
  if (typeof window === 'undefined' || !window.localStorage) return 'normal';
  try {
    const saved = localStorage.getItem(DIFFICULTY_PREF_KEY);
    if (saved === 'easy' || saved === 'normal' || saved === 'hard') {
      return saved;
    }
  } catch {
    // Ignore
  }
  return 'normal';
}

export function saveDifficulty(difficulty: DifficultyLevel): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(DIFFICULTY_PREF_KEY, difficulty);
  } catch {
    // Ignore
  }
}

export function getAllStoredScores(): Record<DifficultyLevel, number> {
  return {
    easy: getHighScore('easy'),
    normal: getHighScore('normal'),
    hard: getHighScore('hard'),
  };
}

export function clearAllLocalGameData(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(SCORE_KEYS.easy);
    localStorage.removeItem(SCORE_KEYS.normal);
    localStorage.removeItem(SCORE_KEYS.hard);
    localStorage.removeItem(DIFFICULTY_PREF_KEY);
    // Remove any legacy keys
    localStorage.removeItem('sketch_run_high_score_midtown_easy');
    localStorage.removeItem('sketch_run_high_score_midtown_normal');
    localStorage.removeItem('sketch_run_high_score_midtown_hard');
    localStorage.removeItem('sketch_run_high_score_midtown');
  } catch {
    // Ignore
  }
}
