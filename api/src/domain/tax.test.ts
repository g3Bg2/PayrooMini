import { describe, test, expect } from 'vitest';
import { taxFromGross } from './tax';

describe('taxFromGross', () => {
  test('should return 0 tax for gross <= 370', () => {
    expect(taxFromGross(370)).toBe(0);
    expect(taxFromGross(369)).toBe(0);
    expect(taxFromGross(0)).toBe(0);
  });

  test('should calculate tax correctly for gross in 370-900 bracket (10%)', () => {
    expect(taxFromGross(900)).toBe(53); // (900 - 370) * 0.10 = 53
    expect(taxFromGross(371)).toBe(0.10); // (371 - 370) * 0.10 = 0.10
    expect(taxFromGross(650)).toBe(28); // (650 - 370) * 0.10 = 28
  });

  test('should calculate tax correctly for gross in 900-1500 bracket (10% + 19%)', () => {
    expect(taxFromGross(1500)).toBe(167); // (900 - 370) * 0.10 + (1500 - 900) * 0.19 = 53 + 114 = 167
    expect(taxFromGross(901)).toBe(53.19); // (900 - 370) * 0.10 + (901 - 900) * 0.19 = 53 + 0.19 = 53.19
    expect(taxFromGross(1200)).toBe(110); // (900 - 370) * 0.10 + (1200 - 900) * 0.19 = 53 + 57 = 110
  });

  test('should calculate tax correctly for gross in 1500-3000 bracket (10% + 19% + 32.5%)', () => {
    expect(taxFromGross(3000)).toBe(654.50); // (900 - 370) * 0.10 + (1500 - 900) * 0.19 + (3000 - 1500) * 0.325 = 53 + 114 + 487.50 = 654.50
    expect(taxFromGross(1501)).toBe(167.32); // (900 - 370) * 0.10 + (1500 - 900) * 0.19 + (1501 - 1500) * 0.325 = 53 + 114 + 0.325 = 167.32
    expect(taxFromGross(2000)).toBe(329.50); // (900 - 370) * 0.10 + (1500 - 900) * 0.19 + (2000 - 1500) * 0.325 = 53 + 114 + 162.50 = 329.50
  });

  test('should calculate tax correctly for gross in 3000-5000 bracket (10% + 19% + 32.5% + 37%)', () => {
    expect(taxFromGross(5000)).toBe(1394.50); // (900 - 370) * 0.10 + (1500 - 900) * 0.19 + (3000 - 1500) * 0.325 + (5000 - 3000) * 0.37 = 53 + 114 + 487.50 + 740 = 1394.50
    expect(taxFromGross(3001)).toBe(654.87); // (900 - 370) * 0.10 + (1500 - 900) * 0.19 + (3000 - 1500) * 0.325 + (3001 - 3000) * 0.37 = 654.50 + 0.37 = 654.87
    expect(taxFromGross(4000)).toBe(1024.50); // (900 - 370) * 0.10 + (1500 - 900) * 0.19 + (3000 - 1500) * 0.325 + (4000 - 3000) * 0.37 = 53 + 114 + 487.50 + 370 = 1024.50
  });

  test('should calculate tax correctly for gross > 5000 (10% + 19% + 32.5% + 37% + 45%)', () => {
    expect(taxFromGross(6000)).toBe(1844.50); // (900 - 370) * 0.10 + (1500 - 900) * 0.19 + (3000 - 1500) * 0.325 + (5000 - 3000) * 0.37 + (6000 - 5000) * 0.45 = 1394.50 + 450 = 1844.50
    expect(taxFromGross(5001)).toBe(1394.95); // 1394.50 + (5001 - 5000) * 0.45 = 1394.50 + 0.45 = 1394.95
    expect(taxFromGross(10000)).toBe(3644.50); // 1394.50 + (10000 - 5000) * 0.45 = 1394.50 + 2250 = 3644.50
  });

  test('should handle negative or invalid gross amounts', () => {
    expect(taxFromGross(-100)).toBe(0); // Negative gross should return 0
    expect(taxFromGross(0)).toBe(0); // Zero gross should return 0
  });
});