import { defineConfig } from 'drizzle-kit'
import { env } from '@/app/env'

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema.ts',
  out: './supabase/migrations',
  dbCredentials: {
    url: env.POSTGRES_URL,
  },
})
