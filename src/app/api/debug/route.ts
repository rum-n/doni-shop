import { NextResponse } from "next/server";
import { testDatabaseConnection } from "@/lib/db";

export async function GET() {
  try {
    const dbConnected = await testDatabaseConnection();

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: {
        connected: dbConnected,
        url: process.env.DATABASE_URL ? "Set" : "Not set",
      },
      nextauth: {
        secret: process.env.NEXTAUTH_SECRET ? "Set" : "Not set",
        url: process.env.NEXTAUTH_URL || "Not set",
      },
      api: {
        secret: process.env.API_SECRET ? "Set" : "Not set",
      },
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
