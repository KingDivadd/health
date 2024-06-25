import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'
import { redis_url } from './constants'

const prisma = new PrismaClient()

export default prisma

if (!redis_url) {
<<<<<<< HEAD
    throw new Error('REDIS URL not found')
=======
    throw new Error('REDIS URL not found.')
>>>>>>> 45cff2e820690f46450a14c2d8bfee165345d0ca
}
export const redis_client = new Redis(redis_url)