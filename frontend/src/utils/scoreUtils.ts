/**
 * Score Normalization & Formatting Utilities
 *
 * Handles both 0–100 scale (backend raw) and 0–10 scale (normalized) scores.
 * Ensures consistent 1-decimal-place display: e.g. "8.2/10", "4.0/10", "0.0/10".
 * Overall viability score: e.g. "77% (7.7/10)".
 */

/**
 * Normalises any numeric score to the 0–10 scale.
 * Values > 10 are assumed to be on the 0–100 scale and are divided by 10.
 * Values already on 0–10 are returned unchanged.
 * Null / undefined / NaN → returns null.
 */
export function normaliseScore(raw: number | string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw));
  if (isNaN(n)) return null;
  // Clamp to valid range FIRST (handles negatives), then detect scale
  const clamped = Math.max(0, Math.min(100, n));
  // Values above 10 are treated as 0–100 scale → divide by 10
  return clamped > 10 ? Math.round((clamped / 10) * 10) / 10 : Math.round(clamped * 10) / 10;
}

/**
 * Formats any score (0-100 scale or 0-10 scale) to one decimal place with "/10" suffix.
 * Automatically normalises raw 0-100 scores by dividing by 10.
 * Scores already on 0-10 scale are not double-converted.
 *
 * Examples:
 *   formatScore(82)   === "8.2/10"
 *   formatScore(8.2)  === "8.2/10"
 *   formatScore(0)    === "0.0/10"
 *   formatScore(40)   === "4.0/10"
 *   formatScore(64)   === "6.4/10"
 *   formatScore(77)   === "7.7/10"
 *   formatScore(85)   === "8.5/10"
 *   formatScore(88)   === "8.8/10"
 *   formatScore(100)  === "10.0/10"
 */
export function formatScore(score: number | string | null | undefined): string {
  const norm = normaliseScore(score);
  if (norm === null || isNaN(norm)) return '—/10';
  return `${norm.toFixed(1)}/10`;
}

/**
 * Converts a 0–10 scale score to a 0–100 progress bar percentage.
 * Clamps to [0, 100].
 */
export function scoreToPercent(score: number | string | null | undefined): number {
  if (score === null || score === undefined) return 0;
  const num = typeof score === 'number' ? score : parseFloat(String(score));
  if (isNaN(num)) return 0;
  return Math.min(100, Math.max(0, num * 10));
}

/**
 * Formats an overall viability score consistently as "77% (7.7/10)".
 * Automatically detects whether inputs are on 0-100 or 0-10 scale
 * and prevents double-conversion.
 */
export function formatOverallScore(
  overall: number | string | null | undefined,
  scoreTen?: number | string | null | undefined
): string {
  if (overall === null || overall === undefined || overall === '') return '—';
  const n = typeof overall === 'number' ? overall : parseFloat(String(overall));
  if (isNaN(n)) return '—';

  let percent: number;
  let ten: number;

  if (scoreTen !== undefined && scoreTen !== null && scoreTen !== '') {
    const sTen = typeof scoreTen === 'number' ? scoreTen : parseFloat(String(scoreTen));
    percent = Math.round(n > 10 ? n : n * 10);
    const normTen = normaliseScore(sTen);
    ten = normTen !== null ? normTen : Math.round((percent / 10) * 10) / 10;
  } else if (n > 10) {
    percent = Math.round(n);
    ten = Math.round((n / 10) * 10) / 10;
  } else {
    percent = Math.round(n * 10);
    ten = Math.round(n * 10) / 10;
  }

  return `${percent}% (${ten.toFixed(1)}/10)`;
}

/**
 * Given a raw score value of unknown scale, returns both a display string
 * and a progress bar percentage.
 */
export function resolveScoreDisplay(raw: number | string | null | undefined): {
  score: number | null;
  display: string;
  percent: number;
} {
  const score = normaliseScore(raw);
  return {
    score,
    display: formatScore(score),
    percent: scoreToPercent(score),
  };
}

/**
 * Standard human-readable labels for all 9 validation metrics across frontend and backend formats.
 */
export const PARAM_LABELS: Record<string, string> = {
  // CamelCase (Frontend 7-parameter keys)
  marketDemand: 'Market Demand',
  problemSeverity: 'Problem-Solution Fit',
  competition: 'Competition & Moat',
  targetCustomer: 'Target Customer Clarity',
  innovation: 'Uniqueness & Innovation',
  feasibility: 'Technical Feasibility',
  revenuePotential: 'Business Potential',

  // Snake_case (Backend 9 metrics)
  market_demand: 'Market Demand',
  problem_solution_fit: 'Problem-Solution Fit',
  target_customer_clarity: 'Target Customer Clarity',
  uniqueness_innovation: 'Uniqueness & Innovation',
  uniqueness: 'Uniqueness & Innovation',
  technical_feasibility: 'Technical Feasibility',
  business_potential: 'Business Potential',
  scalability: 'Scalability',
  risk_level: 'Risk Level',
  risk: 'Risk Level',
};

/**
 * Returns a display-friendly label for any parameter key (camelCase or snake_case).
 */
export function getParamLabel(key: string): string {
  if (PARAM_LABELS[key]) return PARAM_LABELS[key];
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
