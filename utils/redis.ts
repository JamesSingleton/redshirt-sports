import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_TOKEN && !process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error('UPSTASH_REDIS_REST_TOKEN and or UPSTASH_REDIS_REST_URL is not set')
}

const redis = Redis.fromEnv()

export default redis
