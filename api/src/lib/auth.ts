import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; // use env in production

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  if (req.url === "/health" || req.url === "/api/login") return;

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "Unauthorized" });
  }

  const token = authHeader.slice(7).trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded; // attach user info to request
  } catch {
    return reply.code(401).send({ error: "Unauthorized" });
  }
}
