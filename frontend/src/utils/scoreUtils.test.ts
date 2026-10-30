/**
 * Unit tests for score normalization and formatting utilities.
 *
 * Run with: npx vitest run src/utils/scoreUtils.test.ts
 */

import {
  normaliseScore,
  formatScore,
  scoreToPercent,
  resolveScoreDisplay,
  formatOverallScore,
  getParamLabel,
  PARAM_LABELS,
} from './scoreUtils';

describe('normaliseScore', () => {
  // Core requirement: raw 0-100 scores → 0-10 display
  test.each([
    [0, 0.0],
    [40, 4.0],
    [64, 6.4],
    [77, 7.7],
    [82, 8.2],
    [85, 8.5],
    [88, 8.8],
    [100, 10.0],
  ])('normaliseScore(%i) === %f', (input, expected) => {
    expect(normaliseScore(input)).toBeCloseTo(expected, 1);
  });

  // Already 0-10 values should NOT be divided again
  test('does not double-convert a score already on 0-10 scale', () => {
    expect(normaliseScore(0.0)).toBeCloseTo(0.0, 1);
    expect(normaliseScore(4.0)).toBeCloseTo(4.0, 1);
    expect(normaliseScore(6.4)).toBeCloseTo(6.4, 1);
    expect(normaliseScore(7.7)).toBeCloseTo(7.7, 1);
    expect(normaliseScore(8.2)).toBeCloseTo(8.2, 1);
    expect(normaliseScore(8.5)).toBeCloseTo(8.5, 1);
    expect(normaliseScore(8.8)).toBeCloseTo(8.8, 1);
    expect(normaliseScore(10.0)).toBeCloseTo(10.0, 1);
  });

  // Handles edge cases
  test('returns null for null', () => {
    expect(normaliseScore(null)).toBeNull();
  });

  test('returns null for undefined', () => {
    expect(normaliseScore(undefined)).toBeNull();
  });

  test('returns null for NaN string', () => {
    expect(normaliseScore('abc')).toBeNull();
  });

  test('clamps values above 100', () => {
    // 120 is clamped to 100 → 100/10 = 10
    expect(normaliseScore(120)).toBeCloseTo(10.0, 1);
  });

  test('clamps negative values to 0', () => {
    expect(normaliseScore(-5)).toBeCloseTo(0.0, 1);
  });

  test('accepts string representations', () => {
    expect(normaliseScore('82')).toBeCloseTo(8.2, 1);
    expect(normaliseScore('8.2')).toBeCloseTo(8.2, 1);
    expect(normaliseScore('85')).toBeCloseTo(8.5, 1);
    expect(normaliseScore('88')).toBeCloseTo(8.8, 1);
    expect(normaliseScore('40')).toBeCloseTo(4.0, 1);
  });
});

describe('formatScore', () => {
  // Requirement 10: Verify scores of 0, 40, 64, 77, 82, 85, 88, and 100 display
  // as 0.0/10, 4.0/10, 6.4/10, 7.7/10, 8.2/10, 8.5/10, 8.8/10, and 10.0/10 when scale is 0-100.
  test.each([
    [0, '0.0/10'],
    [40, '4.0/10'],
    [64, '6.4/10'],
    [77, '7.7/10'],
    [82, '8.2/10'],
    [85, '8.5/10'],
    [88, '8.8/10'],
    [100, '10.0/10'],
  ])('formatScore(%i) on 0-100 scale === %s', (raw, expected) => {
    expect(formatScore(raw)).toBe(expected);
  });

  // Already 0-10 scale values should format directly with 1 decimal place without double-dividing
  test.each([
    [0.0, '0.0/10'],
    [4.0, '4.0/10'],
    [6.4, '6.4/10'],
    [7.7, '7.7/10'],
    [8.2, '8.2/10'],
    [8.5, '8.5/10'],
    [8.8, '8.8/10'],
    [10.0, '10.0/10'],
  ])('formatScore(%f) on 0-10 scale === %s', (val, expected) => {
    expect(formatScore(val)).toBe(expected);
  });

  // String inputs
  test('formats string representations correctly', () => {
    expect(formatScore('82')).toBe('8.2/10');
    expect(formatScore('8.2')).toBe('8.2/10');
    expect(formatScore('85.0')).toBe('8.5/10');
    expect(formatScore('88')).toBe('8.8/10');
    expect(formatScore('40')).toBe('4.0/10');
  });

  test('returns "—/10" for null', () => {
    expect(formatScore(null)).toBe('—/10');
  });

  test('returns "—/10" for undefined', () => {
    expect(formatScore(undefined)).toBe('—/10');
  });

  test('returns "—/10" for invalid string', () => {
    expect(formatScore('invalid')).toBe('—/10');
  });
});

describe('scoreToPercent', () => {
  test('converts 8.2 to 82', () => {
    expect(scoreToPercent(8.2)).toBeCloseTo(82, 0);
  });

  test('converts 10.0 to 100', () => {
    expect(scoreToPercent(10.0)).toBe(100);
  });

  test('converts 0.0 to 0', () => {
    expect(scoreToPercent(0.0)).toBe(0);
  });

  test('clamps to 100 maximum', () => {
    expect(scoreToPercent(15)).toBe(100);
  });

  test('returns 0 for null', () => {
    expect(scoreToPercent(null)).toBe(0);
  });

  test('returns 0 for undefined', () => {
    expect(scoreToPercent(undefined)).toBe(0);
  });
});

describe('formatOverallScore', () => {
  // Requirement 4: Display overall viability score consistently, e.g. 77% (7.7/10) when original score is 77/100
  test('formats 77 as "77% (7.7/10)"', () => {
    expect(formatOverallScore(77)).toBe('77% (7.7/10)');
  });

  test('formats 77 with explicit 7.7 as "77% (7.7/10)"', () => {
    expect(formatOverallScore(77, 7.7)).toBe('77% (7.7/10)');
  });

  test('avoids double-conversion if overallScore is passed as 77 on 0-100 scale', () => {
    expect(formatOverallScore(77, 77)).toBe('77% (7.7/10)');
  });

  test('formats 7.7 as "77% (7.7/10)"', () => {
    expect(formatOverallScore(7.7)).toBe('77% (7.7/10)');
  });

  test('formats 100 as "100% (10.0/10)"', () => {
    expect(formatOverallScore(100)).toBe('100% (10.0/10)');
  });

  test('formats 0 as "0% (0.0/10)"', () => {
    expect(formatOverallScore(0)).toBe('0% (0.0/10)');
  });

  test('handles null and undefined safely', () => {
    expect(formatOverallScore(null)).toBe('—');
    expect(formatOverallScore(undefined)).toBe('—');
    expect(formatOverallScore('')).toBe('—');
  });
});

describe('resolveScoreDisplay — end-to-end', () => {
  // Full pipeline: raw value → display + percent
  test.each([
    { raw: 0, expectedDisplay: '0.0/10', expectedPercent: 0 },
    { raw: 40, expectedDisplay: '4.0/10', expectedPercent: 40 },
    { raw: 64, expectedDisplay: '6.4/10', expectedPercent: 64 },
    { raw: 77, expectedDisplay: '7.7/10', expectedPercent: 77 },
    { raw: 78, expectedDisplay: '7.8/10', expectedPercent: 78 },
    { raw: 82, expectedDisplay: '8.2/10', expectedPercent: 82 },
    { raw: 85, expectedDisplay: '8.5/10', expectedPercent: 85 },
    { raw: 88, expectedDisplay: '8.8/10', expectedPercent: 88 },
    { raw: 100, expectedDisplay: '10.0/10', expectedPercent: 100 },
  ])('raw=$raw → display=$expectedDisplay, percent=$expectedPercent', ({ raw, expectedDisplay, expectedPercent }) => {
    const { display, percent } = resolveScoreDisplay(raw);
    expect(display).toBe(expectedDisplay);
    expect(percent).toBeCloseTo(expectedPercent, 0);
  });

  test('already 0-10 score is not double-converted', () => {
    const { display, percent } = resolveScoreDisplay(7.7);
    expect(display).toBe('7.7/10');
    expect(percent).toBeCloseTo(77, 0);
  });

  test('null input returns safe defaults', () => {
    const { score, display, percent } = resolveScoreDisplay(null);
    expect(score).toBeNull();
    expect(display).toBe('—/10');
    expect(percent).toBe(0);
  });
});

describe('getParamLabel & PARAM_LABELS', () => {
  // Requirement 2: Fix all validation metrics
  test.each([
    ['market_demand', 'Market Demand'],
    ['marketDemand', 'Market Demand'],
    ['problem_solution_fit', 'Problem-Solution Fit'],
    ['problemSeverity', 'Problem-Solution Fit'],
    ['target_customer_clarity', 'Target Customer Clarity'],
    ['targetCustomer', 'Target Customer Clarity'],
    ['competition', 'Competition & Moat'],
    ['uniqueness_innovation', 'Uniqueness & Innovation'],
    ['innovation', 'Uniqueness & Innovation'],
    ['technical_feasibility', 'Technical Feasibility'],
    ['feasibility', 'Technical Feasibility'],
    ['business_potential', 'Business Potential'],
    ['revenuePotential', 'Business Potential'],
    ['scalability', 'Scalability'],
    ['risk_level', 'Risk Level'],
    ['risk', 'Risk Level'],
  ])('maps %s to %s', (key, expected) => {
    expect(getParamLabel(key)).toBe(expected);
  });
});
