// drizzle.config.ts
import { CONFIG } from '@/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema.ts',
  out: './src/database/migrations',
  dbCredentials: {
    url: CONFIG.POSTGRESQL_DATABASE_URL,
  },
})
