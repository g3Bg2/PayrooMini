import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const employees = require("./data/employees.json") as any[];
const timesheets = require("./data/timesheets.json") as any[];

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.user.create({
      data: {
        email: "test@example.com",
        password:
          "$2b$10$7tf7P68M8xzJeIrkLino5ef.yYRbKJrFTIJyFsbtnGq8DA8U8BpP6",
      },
    });

    for (const e of employees as any[]) {
      await prisma.employee.upsert({
        where: { id: e.id },
        create: {
          id: e.id,
          firstName: e.firstName,
          lastName: e.lastName,
          type: e.type,
          baseHourlyRate: e.baseHourlyRate,
          superRate: e.superRate,
          bankBsb: e.bank?.bsb,
          bankAccount: e.bank?.account,
        },
        update: {
          firstName: e.firstName,
          lastName: e.lastName,
          baseHourlyRate: e.baseHourlyRate,
          superRate: e.superRate,
          bankBsb: e.bank?.bsb,
          bankAccount: e.bank?.account,
        },
      });
    }

    for (const t of timesheets as any[]) {
      const periodStart = new Date(t.periodStart).toISOString();
      const periodEnd = new Date(t.periodEnd).toISOString();

      const existing = await prisma.timesheet.findFirst({
        where: { employeeId: t.employeeId, periodStart, periodEnd },
      });
      if (existing)
        await prisma.timesheet.delete({ where: { id: existing.id } });
      await prisma.timesheet.create({
        data: {
          employeeId: t.employeeId,
          periodStart,
          periodEnd,
          allowances: t.allowances ?? 0,
          entries: {
            create: t.entries.map((e: any) => ({
              date: new Date(e.date).toISOString(),
              start: e.start,
              end: e.end,
              unpaidBreakMins: e.unpaidBreakMins,
            })),
          },
        },
      });
    }
    console.log("Seed complete");
  } catch (error) {
    console.error("Error during seeding:", error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

