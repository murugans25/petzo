import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../../generated/prisma/client';

const globalForPrisma = globalThis as typeof globalThis & { petzoPrisma?: PrismaClient };

export function prismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Neon DATABASE_URL is missing.');
  if (!globalForPrisma.petzoPrisma) {
    globalForPrisma.petzoPrisma = new PrismaClient({
      adapter: new PrismaNeon({ connectionString }),
    });
  }
  return globalForPrisma.petzoPrisma;
}
