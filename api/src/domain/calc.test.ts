import { describe, test, expect } from 'vitest';
import { sumHours, computePayslip, Entry } from './calc';

describe('sumHours', () => {
  const entries: Entry[] = [
    { start: '09:00', end: '17:00', unpaidBreakMins: 0 }, // 8 hours
    { start: '09:00', end: '13:00', unpaidBreakMins: 0 }, // 4 hours
  ];

  test('should sum hours from entries correctly', () => {
    expect(sumHours(entries)).toBe(12); // 8 + 4 = 12
    expect(sumHours([])).toBe(0); // Empty array
  });

  test('should handle entries with breaks', () => {
    const entriesWithBreaks: Entry[] = [
      { start: '09:00', end: '17:00', unpaidBreakMins: 60 }, // 8 - 1 = 7 hours
      { start: '09:00', end: '13:00', unpaidBreakMins: 30 }, // 4 - 0.5 = 3.5 hours
    ];
    expect(sumHours(entriesWithBreaks)).toBe(10.5); // 7 + 3.5 = 10.5
  });

  test('should handle invalid entries', () => {
    const invalidEntries: Entry[] = [
      { start: 'invalid', end: '17:00', unpaidBreakMins: 0 },
    ];
    expect(sumHours(invalidEntries)).toBeNaN(); // Invalid time inputs
  });
});

describe('computePayslip', () => {
  const baseParams = {
    baseRate: 20,
    superRate: 0.105, // 10.5%
    entries: [
      { start: '09:00', end: '17:00', unpaidBreakMins: 0 }, // 8 hours
      { start: '09:00', end: '17:00', unpaidBreakMins: 0 }, // 8 hours
    ],
  };

  test('should compute payslip for normal hours only', () => {
    const result = computePayslip({ ...baseParams, entries: baseParams.entries });
    expect(result).toEqual({
      normalHours: 16,
      overtimeHours: 0,
      gross: 320, // 16 * 20
      tax: 0, // 320 < 370, so no tax
      super: 33.60, // 320 * 0.105
      net: 320, // 320 - 0
    });
  });

  test('should compute payslip with overtime', () => {
    const entriesOvertime: Entry[] = Array(5).fill({ start: '09:00', end: '17:00', unpaidBreakMins: 0 }); // 5 * 8 = 40 hours
    const result = computePayslip({ ...baseParams, entries: entriesOvertime });
    expect(result).toEqual({
      normalHours: 38,
      overtimeHours: 2,
      gross: 820, // (38 * 20) + (2 * 20 * 1.5)
      tax: 45, // (820 - 370) * 0.10 = 45
      super: 86.10, // 820 * 0.105
      net: 775, // 820 - 45
    });
  });

  test('should include allowances in gross', () => {
    const result = computePayslip({ ...baseParams, allowances: 100 });
    expect(result).toEqual({
      normalHours: 16,
      overtimeHours: 0,
      gross: 420, // 16 * 20 + 100
      tax: 5, // (420 - 370) * 0.10 = 5
      super: 44.10, // 420 * 0.105
      net: 415, // 420 - 5
    });
  });

  test('should handle edge case at tax bracket cutovers', () => {
    const entriesForBracket: Entry[] = Array(4).fill({ start: '09:00', end: '17:00', unpaidBreakMins: 0 }); // 4 * 8 = 32 hours
    const baseRate = 5000 / 32; // 156.25
    const result = computePayslip({
      baseRate,
      superRate: baseParams.superRate,
      entries: entriesForBracket,
    });
    expect(result.gross).toBe(5000); // 32 * 156.25 = 5000
    expect(result.tax).toBe(1394.50); // Matches taxFromGross(5000)
    expect(result.super).toBe(525); // 5000 * 0.105 = 525
    expect(result.net).toBe(3605.50); // 5000 - 1394.50
  });

  test('should handle zero or negative inputs', () => {
    const result = computePayslip({ baseRate: 20, superRate: 0.105, entries: [] });
    expect(result).toEqual({
      normalHours: 0,
      overtimeHours: 0,
      gross: 0,
      tax: 0,
      super: 0,
      net: 0,
    });
  });
});