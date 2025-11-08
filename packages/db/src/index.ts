import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// Export types and enums for use in other packages
export * from "@prisma/client";