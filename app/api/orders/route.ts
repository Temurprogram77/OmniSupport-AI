import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: {
          select: { name: true, email: true, phone: true },
        },
        items: true,
        tracking: true,
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { orderNumber: "asc" },
    });

    return NextResponse.json({ orders });
  } catch (error: unknown) {
    console.error("Failed to fetch orders:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Failed to fetch orders", details: message },
      { status: 500 }
    );
  }
}
