import { FastifyInstance } from "fastify";
import { prisma } from "../lib/db";
import { z } from "zod";
import { computePayslip } from "../domain/calc";

export async function payrunsRoutes(app: FastifyInstance) {
  app.get("/", async () =>
    prisma.payrun.findMany({ orderBy: { createdAt: "desc" } })
  );
  app.get("/:id", async (req, reply) => {
    const id = (req.params as any).id as string;
    const pr = await prisma.payrun.findUnique({
      where: { id },
      include: { payslips: true },
    });
    if (!pr) return reply.code(404).send({ error: "Not found" });
    return pr;
  });

  app.post("/generate", async (req, reply) => {
    const schema = z.object({
      periodStart: z.string(),
      periodEnd: z.string(),
      employeeIds: z.array(z.string()).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
      return reply.code(400).send({ error: parsed.error.flatten() });
    const { periodStart, periodEnd, employeeIds } = parsed.data;

    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    const tsWhere: any = { periodStart: start, periodEnd: end };
    if (employeeIds?.length) tsWhere.employeeId = { in: employeeIds };
    const timesheets = await prisma.timesheet.findMany({
      where: tsWhere,
      include: { employee: true, entries: true },
    });
    if (timesheets.length === 0)
      return reply.code(400).send({ error: "No timesheets for period" });
    const slips = timesheets.map((t:any) => {
      const res = computePayslip({
        baseRate: t.employee.baseHourlyRate,
        superRate: t.employee.superRate,
        allowances: t.allowances,
        entries: t.entries.map((e: any) => ({
          start: e.start,
          end: e.end,
          unpaidBreakMins: e.unpaidBreakMins,
        })),
      });
      return {
        employeeId: t.employeeId,
        ...res,
      };
    });
    const totals = slips.reduce(
      (acc: any, s: any) => ({
        gross: +(acc.gross + s.gross).toFixed(2),
        tax: +(acc.tax + s.tax).toFixed(2),
        net: +(acc.net + s.net).toFixed(2),
        super: +(acc.super + s.super).toFixed(2),
      }),
      { gross: 0, tax: 0, net: 0, super: 0 }
    );
    const created = await prisma.payrun.create({
      data: {
        periodStart: start,
        periodEnd: end,
        gross: totals.gross,
        tax: totals.tax,
        net: totals.net,
        super: totals.super,
        payslips: { create: slips },
      },
      include: { payslips: true },
    });
    reply.code(201).send(created);
  });
}
