import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed-data";

export async function POST() {
  try {
    const res = await seedDatabase();
    return NextResponse.json({
      message: "Demo orders and tracking data reset successfully.",
      ...res,
    });
  } catch (error: unknown) {
    console.error("Failed to reset orders:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Failed to reset database", details: message },
      { status: 500 }
    );
  }
}
