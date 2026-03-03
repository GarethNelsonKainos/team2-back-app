import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
const connectionString = databaseUrl?.replace(
	/@localhost:/g,
	"@host.docker.internal:",
);
const schemaName = process.env.SCHEMA_NAME;

const adapter = new PrismaPg({ connectionString }, { schema: schemaName });
const prisma = new PrismaClient({ adapter });

export { prisma };
