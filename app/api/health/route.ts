import { NextResponse } from "next/server";
import { testDatabaseConnection } from "@/lib/prisma";

/**
 * Health Check API Endpoint
 * GET /api/health
 * 
 * Returns the health status of the application and database.
 * Useful for load balancers, kubernetes probes, and monitoring.
 */
export async function GET() {
    try {
        // Test database connection
        const dbHealth = await testDatabaseConnection();

        const health = {
            status: dbHealth.connected ? "healthy" : "unhealthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: {
                connected: dbHealth.connected,
                latencyMs: dbHealth.latencyMs,
                error: dbHealth.error,
            },
            environment: process.env.NODE_ENV,
        };

        const statusCode = dbHealth.connected ? 200 : 503;

        return NextResponse.json(health, { status: statusCode });
    } catch (error) {
        console.error("Health check failed:", error);
        return NextResponse.json(
            {
                status: "error",
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
