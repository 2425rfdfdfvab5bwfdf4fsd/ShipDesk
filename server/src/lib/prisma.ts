import { PrismaClient } from "@prisma/client";

function isConnectionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("kind: Closed") ||
    msg.includes("connection closed") ||
    msg.includes("Connection closed") ||
    msg.includes("Server has closed the connection") ||
    msg.includes("ECONNRESET") ||
    msg.includes("connection reset") ||
    msg.includes("socket hang up")
  );
}

function createClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const baseClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = baseClient;

export const db = baseClient.$extends({
  query: {
    async $allOperations({ args, query }) {
      try {
        return await query(args);
      } catch (err: unknown) {
        if (isConnectionError(err)) {
          console.warn("[prisma] Connection dropped — reconnecting and retrying…");
          try {
            await baseClient.$disconnect();
          } catch {
          }
          await baseClient.$connect();
          return await query(args);
        }
        throw err;
      }
    },
  },
}) as unknown as PrismaClient;

export async function connectDb(): Promise<void> {
  try {
    await baseClient.$connect();
  } catch (err) {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  }
}
