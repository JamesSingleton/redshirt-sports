import { defineConfig } from 'drizzle-kit'
import { env } from '@/app/env'

export default defineConfig({
  dialect: 'postgresql',
  schema: '../../packages/db/src/schema.ts',
  out: './supabase/migrations',
  dbCredentials: {
    url: env.POSTGRES_URL,
  },
})
