import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_TOKEN is not set')
}

const redis = Redis.fromEnv()

export default redis
