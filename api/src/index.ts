import Fastify from "fastify";
import cors from "@fastify/cors";
import { employeesRoutes } from "./routes/employees";
import { timesheetsRoutes } from "./routes/timesheets";
import { payrunsRoutes } from "./routes/payruns";
import { authRoutes } from "./routes/auth";
import { authMiddleware } from "./lib/auth";

const app = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
    },
  },
});

await app.register(cors, { origin: true });
app.addHook("onRequest", authMiddleware);

app.get("/me", async (req) => {
  return { user: (req as any).user };
});
app.get("/health", async () => ({ ok: true }));
app.register(authRoutes, { prefix: "/api" });
app.register(employeesRoutes, { prefix: "/api/employees" });
app.register(timesheetsRoutes, { prefix: "/api/timesheets" });
app.register(payrunsRoutes, { prefix: "/api/payruns" });

const port = Number(process.env.PORT || 4000);
await app.listen({ port, host: "0.0.0.0" });
console.log(`API listening on ${port}`);
