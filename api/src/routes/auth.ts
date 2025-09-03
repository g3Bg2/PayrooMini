import { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { logger } from "../lib/logger";
import {prisma} from "../lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/login", async (req, reply) => {
    const { email, password } = req.body as any;

    logger.info({ email }, "Login attempt");

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      logger.warn({ email }, "Login failed: user not found");
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn({ email }, "Login failed: incorrect password");
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    logger.info({ email }, "Login successful");

    return { token };
  });
}
