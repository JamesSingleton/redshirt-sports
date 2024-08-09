import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_TOKEN && !process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error('UPSTASH_REDIS_REST_TOKEN and or UPSTASH_REDIS_REST_URL is not set')
}

console.log('Before Redis.fromEnv()')

const redis = Redis.fromEnv()

console.log('After Redis.fromEnv()', redis)

export default redis
