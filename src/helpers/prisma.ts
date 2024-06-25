import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'
import { redis_url } from './constants'

const prisma = new PrismaClient()

export default prisma

if (!redis_url) {
    throw new Error('REDIS URL not found')
}
export const redis_client = new Redis(redis_url)