import type { Config } from 'drizzle-kit'

export default {
  schema: './src/schema.ts',
  out: '../../apps/web/supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
} satisfies Config
