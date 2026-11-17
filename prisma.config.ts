import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: '.env.local' });
config();

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://petzo:petzo@localhost:5432/petzo';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: databaseUrl },
});
