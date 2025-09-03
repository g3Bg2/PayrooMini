
import { z } from "zod";

export const EmployeeSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  type: z.literal("hourly"),
  baseHourlyRate: z.number().positive(),
  superRate: z.number().min(0).max(1),
  bank: z.object({ bsb: z.string(), account: z.string() }).partial().optional()
});
export type Employee = z.infer<typeof EmployeeSchema>;

export const TimesheetEntrySchema = z.object({
  date: z.string(),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  unpaidBreakMins: z.number().int().min(0)
});

export const TimesheetSchema = z.object({
  employeeId: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  entries: z.array(TimesheetEntrySchema).min(1),
  allowances: z.number().default(0)
});

export const PayrunRequestSchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
  employeeIds: z.array(z.string()).optional()
});
