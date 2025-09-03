import { taxFromGross } from "./tax";
import { hoursBetween, weeklySplitHours } from "./time";

export type Entry = { start: string; end: string; unpaidBreakMins: number };

export function sumHours(entries: Entry[]): number {
  const total = entries.reduce((acc, e) => {
    const hours = hoursBetween(e.start, e.end, e.unpaidBreakMins);
    if (isNaN(hours)) return NaN;
    return acc + hours;
  }, 0);
  return isNaN(total) ? total : +total.toFixed(2);
}

export function computePayslip(params: {
  baseRate: number;
  superRate: number;
  entries: Entry[];
  allowances?: number;
}) {
  const totalHours = sumHours(params.entries);
  const { normal, overtime } = weeklySplitHours(totalHours, 38);
  const gross = +(normal * params.baseRate + overtime * params.baseRate * 1.5 + (params.allowances ?? 0)).toFixed(2);
  const tax = taxFromGross(gross);
  const spr = +(gross * params.superRate).toFixed(2);
  const net = +(gross - tax).toFixed(2);
  return {
    normalHours: +normal.toFixed(2),
    overtimeHours: +overtime.toFixed(2),
    gross,
    tax,
    super: spr,
    net,
  };
}