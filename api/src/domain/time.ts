import { DateTime } from 'luxon';

export function hoursBetween(start: string, end: string, unpaidBreakMins: number) {
  const startTime = DateTime.fromFormat(start, 'HH:mm');
  const endTime = DateTime.fromFormat(end, 'HH:mm');
  if (!startTime.isValid || !endTime.isValid) return NaN;
  const diff = endTime.diff(startTime, 'hours').hours;
  return diff - unpaidBreakMins / 60;
}

export function weeklySplitHours(totalHours: number, threshold = 38) {
  const normal = Math.min(threshold, Math.max(0, totalHours)); // Clamp negative hours to 0
  const overtime = Math.max(0, totalHours - threshold);
  return { normal: +normal.toFixed(2), overtime: +overtime.toFixed(2) };
}