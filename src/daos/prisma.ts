import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
const schemaName = process.env.SCHEMA_NAME;

const adapter = new PrismaPg({ connectionString }, { schema: schemaName });
const prisma = new PrismaClient({ adapter });

export { prisma };
