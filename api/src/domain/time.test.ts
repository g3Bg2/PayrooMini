import { describe, test, expect } from 'vitest';
import { hoursBetween, weeklySplitHours } from './time';

describe('hoursBetween', () => {
  test('should calculate hours between start and end times correctly', () => {
    expect(hoursBetween('09:00', '17:00', 0)).toBe(8); // 8 hours
    expect(hoursBetween('09:00', '17:00', 30)).toBe(7.5); // 8 - 0.5 = 7.5 hours
    expect(hoursBetween('12:00', '13:30', 0)).toBe(1.5); // 1.5 hours
  });

  test('should handle same-day edge cases', () => {
    expect(hoursBetween('09:00', '09:00', 0)).toBe(0); // Same start/end
    expect(hoursBetween('09:00', '09:30', 60)).toBe(-0.5); // More break than duration
  });

  test('should handle invalid time inputs gracefully', () => {
    expect(hoursBetween('25:00', '17:00', 0)).toBeNaN(); // Invalid start time
    expect(hoursBetween('09:00', 'invalid', 0)).toBeNaN(); // Invalid end time
    expect(hoursBetween('09:00', '17:00', -30)).toBe(8.5); // Negative break
  });
});

describe('weeklySplitHours', () => {
  test('should split hours correctly below threshold', () => {
    expect(weeklySplitHours(30)).toEqual({ normal: 30, overtime: 0 });
    expect(weeklySplitHours(38)).toEqual({ normal: 38, overtime: 0 });
  });

  test('should split hours correctly at and above threshold', () => {
    expect(weeklySplitHours(40)).toEqual({ normal: 38, overtime: 2 }); // 38 normal + 2 overtime
    expect(weeklySplitHours(38.01)).toEqual({ normal: 38, overtime: 0.01 }); // Edge case just above threshold
  });

  test('should handle edge cases and invalid inputs', () => {
    expect(weeklySplitHours(0)).toEqual({ normal: 0, overtime: 0 });
    expect(weeklySplitHours(-5)).toEqual({ normal: 0, overtime: 0 }); // Negative hours
  });

  test('should respect custom threshold', () => {
    expect(weeklySplitHours(40, 35)).toEqual({ normal: 35, overtime: 5 }); // Custom threshold
    expect(weeklySplitHours(30, 35)).toEqual({ normal: 30, overtime: 0 });
  });
});