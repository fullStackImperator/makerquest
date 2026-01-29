// lib/db.ts

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/client'
// import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})


export const db = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Add this temporarily to debug
// console.log('Available models:', Object.keys(db).filter(key => !key.startsWith('$') && !key.startsWith('_')))

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined
// }

// export const db = globalForPrisma.prisma ?? new PrismaClient()

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db