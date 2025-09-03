import { FastifyInstance } from "fastify";
import { prisma } from "../lib/db";
import { z } from "zod";
import { logger } from "../lib/logger";

export async function employeesRoutes(app: FastifyInstance) {
  // ✅ GET all employees
  app.get("/", async () => {
    logger.info("Fetching all employees");
    const employees = await prisma.employee.findMany();
    logger.info({ count: employees.length }, "Fetched employees count");
    return employees;
  });

  // ✅ Get all timesheets for a specific employee
  app.get("/:employeeId", async (req, reply) => {
    const { employeeId } = req.params as { employeeId: string };
    logger.info({ employeeId }, "Fetching timesheets for employee");

    const timesheets = await prisma.timesheet.findMany({
      where: { employeeId },
      include: { employee: true, entries: true },
      orderBy: { periodStart: "desc" },
    });

    if (!timesheets || timesheets.length === 0) {
      logger.warn({ employeeId }, "No timesheets found");
      return reply
        .code(404)
        .send({ error: "No timesheets found for this employee" });
    }

    logger.info({ employeeId, count: timesheets.length }, "Timesheets fetched");
    return timesheets;
  });

  // ✅ POST - Create employee
  app.post("/", async (req, reply) => {
    const schema = z.object({
      firstName: z.string(),
      lastName: z.string(),
      type: z.enum(["Full-time", "Part-time", "Casual"]),
      baseHourlyRate: z.number(),
      superRate: z.number(),
      bankBsb: z.string(),
      bankAccount: z.string(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn(
        { error: parsed.error.flatten() },
        "Invalid employee creation request"
      );
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const e = parsed.data;

    const employee = await prisma.employee.create({
      data: {
        id: crypto.randomUUID(),
        firstName: e.firstName,
        lastName: e.lastName,
        type: e.type,
        baseHourlyRate: e.baseHourlyRate,
        superRate: e.superRate,
        bankBsb: e.bankBsb,
        bankAccount: e.bankAccount,
      },
    });

    logger.info({ id: employee.id }, "Employee created");
    return reply.code(201).send(employee);
  });

  // ✅ PUT - Update employee
  app.put("/:id", async (req, reply) => {
    const id = (req.params as { id: string }).id;

    const schema = z.object({
      firstName: z.string(),
      lastName: z.string(),
      type: z.enum(["Full-time", "Part-time", "Casual"]),
      baseHourlyRate: z.number(),
      superRate: z.number(),
      bankBsb: z.string(),
      bankAccount: z.string(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn(
        { id, error: parsed.error.flatten() },
        "Invalid employee update request"
      );
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const e = parsed.data;

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        firstName: e.firstName,
        lastName: e.lastName,
        type: e.type,
        baseHourlyRate: e.baseHourlyRate,
        superRate: e.superRate,
        bankBsb: e.bankBsb,
        bankAccount: e.bankAccount,
      },
    });

    logger.info({ id }, "Employee updated");
    return reply.send(updated);
  });

  // ✅ DELETE - Remove employee
  app.delete("/:id", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    logger.info({ id }, "Attempting to delete employee");

    try {
      await prisma.employee.delete({ where: { id } });
      logger.info({ id }, "Employee deleted");
      return reply.code(204).send();
    } catch (err) {
      logger.warn({ id }, "Employee not found");
      console.error(err);
      return reply.code(404).send({ error: "Employee not found" });
    }
  });
}
