import { FastifyInstance } from "fastify";
import { prisma } from "../lib/db";
import { z } from "zod";

export async function timesheetsRoutes(app: FastifyInstance) {
  // ✅ Get all timesheets
  app.get("/", async () => {
    return prisma.timesheet.findMany({
      include: { employee: true, entries: true },
      orderBy: { periodStart: "desc" },
    });
  });

  // ✅ Get a timesheet by ID
  app.get("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const ts = await prisma.timesheet.findUnique({
      where: { id },
      include: { employee: true, entries: true },
    });
    if (!ts) return reply.code(404).send({ error: "Timesheet not found" });
    return ts;
  });

  // ✅ Create or append single entry timesheet
  app.post("/", async (req, reply) => {
    const SingleEntrySchema = z.object({
      employeeId: z.string(),
      date: z.string(), // ISO date string
      startTime: z.string(),
      endTime: z.string(),
      breakMinutes: z.number(),
      allowance: z.number().optional(),
      startDate: z.string(), // ISO string
      endDate: z.string(), // ISO string
    });

    const parsed = SingleEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const {
      employeeId,
      date,
      startTime,
      endTime,
      breakMinutes,
      allowance,
      startDate,
      endDate,
    } = parsed.data;

    const periodStartDate = new Date(startDate);
    const periodEndDate = new Date(endDate);

    // check if a timesheet for that employee + period already exists
    const existing = await prisma.timesheet.findFirst({
      where: {
        employeeId,
        periodStart: periodStartDate,
        periodEnd: periodEndDate,
      },
      include: { entries: true },
    });

    if (existing) {
      // ✅ append new entry
      const updated = await prisma.timesheet.update({
        where: { id: existing.id },
        data: {
          allowances: allowance ?? 0,
          entries: {
            create: [
              {
                date: new Date(date),
                start: startTime,
                end: endTime,
                unpaidBreakMins: breakMinutes,
              },
            ],
          },
        },
        include: { entries: true },
      });

      return reply.code(200).send(updated);
    } else {
      // ✅ create new timesheet with the entry
      const created = await prisma.timesheet.create({
        data: {
          employeeId,
          periodStart: periodStartDate,
          periodEnd: periodEndDate,
          allowances: allowance ?? 0,
          entries: {
            create: [
              {
                date: new Date(date),
                start: startTime,
                end: endTime,
                unpaidBreakMins: breakMinutes,
              },
            ],
          },
        },
        include: { entries: true },
      });

      return reply.code(201).send(created);
    }
  });

  // ✅ Update timesheet (replace entries)
  app.put("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };

    const UpdateSchema = z.object({
      allowances: z.number().optional(),
      entries: z.array(
        z.object({
          date: z.string(),
          start: z.string(),
          end: z.string(),
          unpaidBreakMins: z.number(),
        })
      ),
    });

    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success)
      return reply.code(400).send({ error: parsed.error.flatten() });
    const { allowances, entries } = parsed.data;

    const ts = await prisma.timesheet.findUnique({ where: { id } });
    if (!ts) return reply.code(404).send({ error: "Timesheet not found" });

    // delete old entries and replace
    await prisma.timesheetEntry.deleteMany({ where: { timesheetId: id } });

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        allowances: allowances ?? 0,
        entries: {
          create: entries.map((e: any) => ({
            date: new Date(e.date),
            start: e.start,
            end: e.end,
            unpaidBreakMins: e.unpaidBreakMins,
          })),
        },
      },
      include: { entries: true },
    });

    return updated;
  });

  // ✅ Update a single timesheet entry
  app.put("/entries/:entryId", async (req, reply) => {
    const { entryId } = req.params as { entryId: string };

    const EntryUpdateSchema = z.object({
      date: z.string().optional(),
      start: z.string().optional(),
      end: z.string().optional(),
      unpaidBreakMins: z.number().optional(),
      allowance: z.number().optional(),
    });

    const parsed = EntryUpdateSchema.safeParse(req.body);
    if (!parsed.success)
      return reply.code(400).send({ error: parsed.error.flatten() });
    const { date, start, end, unpaidBreakMins } = parsed.data;

    const entry = await prisma.timesheetEntry.findUnique({
      where: { id: entryId },
    });
    if (!entry)
      return reply.code(404).send({ error: "Timesheet entry not found" });

    const ts = await prisma.timesheet.findUnique({
      where: { id: entry.timesheetId },
    });
    if (!ts) return reply.code(404).send({ error: "Timesheet not found" });

    // if allowance is provided in body, update timesheet's allowance
    if (parsed.data.allowance !== undefined) {
      await prisma.timesheet.update({
        where: { id: ts.id },
        data: { allowances: parsed.data.allowance },
      });
    }

    // update entry
    const updated = await prisma.timesheetEntry.update({
      where: { id: entryId },
      data: {
        date: date ? new Date(date) : entry.date,
        start: start ?? entry.start,
        end: end ?? entry.end,
        unpaidBreakMins: unpaidBreakMins ?? entry.unpaidBreakMins,
      },
    });

    return updated;
  });

  // ✅ Delete timesheet
  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await prisma.timesheet.delete({ where: { id } });
      return reply.code(204).send();
    } catch {
      return reply.code(404).send({ error: "Timesheet not found" });
    }
  });

  // ✅ Delete entry of a timesheet by entry ID
  app.delete("/entries/:entryId", async (req, reply) => {
    const { entryId } = req.params as { entryId: string };
    try {
      await prisma.timesheetEntry.delete({ where: { id: entryId } });
      return reply.code(204).send();
    } catch {
      return reply.code(404).send({ error: "Timesheet entry not found" });
    }
  });
}
