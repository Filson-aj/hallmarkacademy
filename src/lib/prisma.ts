
import { PrismaClient } from '@/generated/prisma';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const prismaClientSingleton = () => {
    const allowSelfSigned = process.env.PGSSL_ALLOW_SELF_SIGNED === "true";
    const pool =
        globalThis.pgPool ??
        new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: allowSelfSigned ? { rejectUnauthorized: false } : undefined,
        });

    if (process.env.NODE_ENV !== "production") {
        globalThis.pgPool = pool;
    }

    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
    pgPool?: Pool;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
