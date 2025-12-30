import { PrismaClient } from '@prisma/client'

// ============================================
// Prisma Client Singleton with Error Handling
// ============================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Creates Prisma client with appropriate logging
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Test database connection health.
 * Useful for health check endpoints or startup validation.
 */
export async function testDatabaseConnection(): Promise<{
  connected: boolean
  error?: string
  latencyMs?: number
}> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return {
      connected: true,
      latencyMs: Date.now() - start,
    }
  } catch (error) {
    console.error('Database connection failed:', error)
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
    }
  }
}

/**
 * Gracefully disconnect Prisma client.
 * Call this during app shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
    console.log('Database disconnected successfully')
  } catch (error) {
    console.error('Error disconnecting database:', error)
    throw error
  }
}

// Handle process termination gracefully
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await disconnectDatabase()
  })
}

