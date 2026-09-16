import { Type, FunctionDeclaration } from "@google/genai";
import { prisma } from "../prisma";

// ==========================================
// Tool Function Declarations for Gemini
// ==========================================

export const getOrderDetailsDeclaration: FunctionDeclaration = {
  name: "getOrderDetails",
  description:
    "Retrieve complete details of a customer order including items, line totals, shipping address, status, and tracking summary.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderNumber: {
        type: Type.STRING,
        description: "The unique order identifier, e.g. ORD-1001, ORD-1002.",
      },
    },
    required: ["orderNumber"],
  },
};

export const getCourierStatusDeclaration: FunctionDeclaration = {
  name: "getCourierStatus",
  description:
    "Retrieve real-time courier tracking information, carrier name, tracking number, current location, estimated delivery, and full checkpoint timeline.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderNumber: {
        type: Type.STRING,
        description: "The order number to check courier tracking for, e.g. ORD-1002.",
      },
      trackingNumber: {
        type: Type.STRING,
        description: "The courier tracking number if known, e.g. FX-98214301 or DHL-88349102.",
      },
    },
  },
};

export const updateDeliveryAddressDeclaration: FunctionDeclaration = {
  name: "updateDeliveryAddress",
  description:
    "Update the shipping address of an order in the database. Business rule: ONLY permitted if the order is in PENDING or PROCESSING status. If SHIPPED or DELIVERED, it will be rejected.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderNumber: {
        type: Type.STRING,
        description: "The order number to update, e.g. ORD-1001.",
      },
      street: {
        type: Type.STRING,
        description: "The new street address including apartment/suite number, e.g. 742 Evergreen Terrace.",
      },
      city: {
        type: Type.STRING,
        description: "The city name, e.g. Springfield.",
      },
      state: {
        type: Type.STRING,
        description: "The 2-letter state or province code, e.g. OR or CA.",
      },
      postalCode: {
        type: Type.STRING,
        description: "Postal/ZIP code, e.g. 97477.",
      },
      country: {
        type: Type.STRING,
        description: "The country name or code, e.g. USA.",
      },
    },
    required: ["orderNumber", "street", "city", "state", "postalCode"],
  },
};

export const cancelOrderDeclaration: FunctionDeclaration = {
  name: "cancelOrder",
  description:
    "Cancel an order in the database. Business rule: ONLY permitted if the order status is PENDING or PROCESSING. Orders that are SHIPPED, OUT_FOR_DELIVERY, DELIVERED, or already CANCELLED cannot be cancelled.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderNumber: {
        type: Type.STRING,
        description: "The order number to cancel, e.g. ORD-1001.",
      },
      reason: {
        type: Type.STRING,
        description: "The customer's reason for cancellation.",
      },
    },
    required: ["orderNumber", "reason"],
  },
};

export const escalateToHumanAgentDeclaration: FunctionDeclaration = {
  name: "escalateToHumanAgent",
  description:
    "Escalate the support ticket to a human logistics specialist for complex cases, lost packages, or exceptions requiring manager intervention.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderNumber: {
        type: Type.STRING,
        description: "The relevant order number if applicable.",
      },
      reason: {
        type: Type.STRING,
        description: "Detailed reason for human escalation.",
      },
      urgency: {
        type: Type.STRING,
        description: "Urgency level: LOW, MEDIUM, or HIGH.",
      },
    },
    required: ["reason"],
  },
};

export const geminiTools = [
  {
    functionDeclarations: [
      getOrderDetailsDeclaration,
      getCourierStatusDeclaration,
      updateDeliveryAddressDeclaration,
      cancelOrderDeclaration,
      escalateToHumanAgentDeclaration,
    ],
  },
];

export const SYSTEM_INSTRUCTION = `You are "OmniSupport AI", an autonomous e-commerce and logistics customer support specialist.
Your goal is to assist customers accurately, empathetically, and efficiently regarding their orders, shipment tracking, address updates, and cancellations.

Operational Rules & Guidelines:
1. When a customer inquires about an order (e.g. ORD-1001), invoke the 'getOrderDetails' tool to fetch accurate live data.
2. When a customer asks where their package is or wants to track shipment, invoke 'getCourierStatus'.
3. When a customer asks to change their delivery address:
   - Call 'updateDeliveryAddress' with the new address details.
   - Note: Address changes are ONLY permitted if the order is still PENDING or PROCESSING.
   - If the tool response returns status "REJECTED" (e.g., because the order is already SHIPPED or DELIVERED), empathetically explain why the request cannot be completed and provide alternative assistance.
4. When a customer asks to cancel an order:
   - Call 'cancelOrder' with the order number and reason.
   - Note: Cancellations are ONLY permitted for orders in PENDING or PROCESSING status.
   - If the tool response returns status "REJECTED" (e.g., order is SHIPPED or OUT_FOR_DELIVERY), explain that the shipment cannot be intercepted in transit, but provide clear instructions on how they can initiate a hassle-free return once delivered.
5. If the user presents an edge case (e.g., package stolen, damaged, extreme delay), offer to escalate via 'escalateToHumanAgent'.
6. Maintain a professional, helpful, and concise tone. Format key information like tracking numbers, order numbers, amounts, and dates clearly.
`;

// =========================================================================
// Defensive Tool Implementations: Never throw raw errors, return clean JSON
// =========================================================================

// 1. Tool Executor: getOrderDetails
export async function executeGetOrderDetails(args: { orderNumber: string }) {
  try {
    const orderNumber =
      typeof args?.orderNumber === "string" ? args.orderNumber.trim().toUpperCase() : "";

    if (!orderNumber) {
      return {
        success: false,
        status: "FAILED",
        found: false,
        error: "Order number is required.",
      };
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        courierTracking: true,
        customer: {
          select: { name: true, email: true, phone: true },
        },
      },
    });

    if (!order) {
      return {
        success: false,
        status: "REJECTED",
        found: false,
        reason: `No order found with order number "${orderNumber}".`,
        error: `No order found with order number "${orderNumber}" in our records. Please verify the order ID.`,
      };
    }

    return {
      success: true,
      status: "COMPLETED",
      found: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: order.customer?.name || "Customer",
        customerEmail: order.customer?.email || "",
        totalAmount: order.totalAmount,
        currency: order.currency,
        shippingAddress: {
          street: order.shippingStreet,
          city: order.shippingCity,
          state: order.shippingState,
          postalCode: order.shippingPostalCode,
          country: order.shippingCountry,
        },
        items: order.items.map((item) => ({
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        })),
        tracking: order.courierTracking
          ? {
              courierName: order.courierTracking.courierName,
              trackingNumber: order.courierTracking.trackingNumber,
              currentStatus: order.courierTracking.currentStatus,
              currentLocation: order.courierTracking.currentLocation,
              estimatedDelivery: order.courierTracking.estimatedDelivery,
            }
          : null,
        createdAt: order.createdAt.toISOString(),
        cancelReason: order.cancelReason,
      },
    };
  } catch (error: unknown) {
    console.error("Defensive error in executeGetOrderDetails:", error);
    const msg = error instanceof Error ? error.message : "Database lookup failed";
    return {
      success: false,
      status: "FAILED",
      found: false,
      error: `Unable to retrieve order details: ${msg}`,
    };
  }
}

// 2. Tool Executor: getCourierStatus
export async function executeGetCourierStatus(args: {
  orderNumber?: string;
  trackingNumber?: string;
}) {
  try {
    const orderNumber =
      typeof args?.orderNumber === "string" ? args.orderNumber.trim().toUpperCase() : undefined;
    const trackingNumber =
      typeof args?.trackingNumber === "string" ? args.trackingNumber.trim().toUpperCase() : undefined;

    let tracking = null;

    if (trackingNumber) {
      tracking = await prisma.courierTracking.findUnique({
        where: { trackingNumber },
        include: { order: true },
      });
    } else if (orderNumber) {
      tracking = await prisma.courierTracking.findFirst({
        where: {
          order: { orderNumber },
        },
        include: { order: true },
      });
    }

    if (!tracking) {
      return {
        success: false,
        status: "REJECTED",
        found: false,
        reason: `No courier tracking records found for ${
          orderNumber ? `Order #${orderNumber}` : `Tracking #${trackingNumber || "unknown"}`
        }.`,
        error: `No courier tracking records found for ${
          orderNumber ? `Order #${orderNumber}` : `Tracking #${trackingNumber || "unknown"}`
        }.`,
      };
    }

    let events: unknown[] = [];
    try {
      events = JSON.parse(tracking.eventsJson);
    } catch {
      events = [];
    }

    return {
      success: true,
      status: "COMPLETED",
      found: true,
      trackingNumber: tracking.trackingNumber,
      courierName: tracking.courierName,
      orderNumber: tracking.order?.orderNumber || orderNumber,
      orderStatus: tracking.order?.status || "UNKNOWN",
      currentStatus: tracking.currentStatus,
      currentLocation: tracking.currentLocation,
      estimatedDelivery: tracking.estimatedDelivery,
      checkpoints: events,
      lastUpdated: tracking.updatedAt.toISOString(),
    };
  } catch (error: unknown) {
    console.error("Defensive error in executeGetCourierStatus:", error);
    const msg = error instanceof Error ? error.message : "Courier lookup failed";
    return {
      success: false,
      status: "FAILED",
      found: false,
      error: `Unable to retrieve courier status: ${msg}`,
    };
  }
}

// 3. Tool Executor: updateDeliveryAddress
export async function executeUpdateDeliveryAddress(args: {
  orderNumber: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}) {
  try {
    const orderNumber =
      typeof args?.orderNumber === "string" ? args.orderNumber.trim().toUpperCase() : "";

    if (!orderNumber) {
      return {
        success: false,
        status: "FAILED",
        error: "Order number is required to update delivery address.",
      };
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { customer: true },
    });

    if (!order) {
      return {
        success: false,
        status: "REJECTED",
        reason: `Order "${orderNumber}" was not found.`,
        error: `Order "${orderNumber}" was not found in our records.`,
      };
    }

    // Business rule guardrail: only PENDING or PROCESSING allowed
    if (order.status !== "PENDING" && order.status !== "PROCESSING") {
      return {
        success: false,
        status: "REJECTED",
        ruleViolation: true,
        currentStatus: order.status,
        reason: `Cannot update delivery address: Order ${orderNumber} is already "${order.status}". Once an order has been dispatched or delivered, address alterations must be requested directly with the carrier.`,
        error: `Cannot update delivery address: Order ${orderNumber} is already "${order.status}". Dispatched shipments cannot be rerouted in warehouse system.`,
      };
    }

    const oldAddress = `${order.shippingStreet}, ${order.shippingCity}, ${order.shippingState} ${order.shippingPostalCode}, ${order.shippingCountry}`;
    const newCountry = (args.country && args.country.trim()) || order.shippingCountry || "USA";

    const updatedOrder = await prisma.order.update({
      where: { orderNumber },
      data: {
        shippingStreet: (args.street || "").trim(),
        shippingCity: (args.city || "").trim(),
        shippingState: (args.state || "").trim().toUpperCase(),
        shippingPostalCode: (args.postalCode || "").trim(),
        shippingCountry: newCountry.trim(),
      },
      include: { items: true, courierTracking: true },
    });

    const newAddress = `${updatedOrder.shippingStreet}, ${updatedOrder.shippingCity}, ${updatedOrder.shippingState} ${updatedOrder.shippingPostalCode}, ${updatedOrder.shippingCountry}`;

    // Record audit log defensively
    try {
      await prisma.auditLog.create({
        data: {
          orderId: order.id,
          action: "ADDRESS_UPDATED",
          details: `Shipping address modified by AI agent from [${oldAddress}] to [${newAddress}].`,
          performedBy: "AI_AGENT (Gemini Flash)",
        },
      });
    } catch (auditErr) {
      console.warn("Non-fatal: Failed to write audit log:", auditErr);
    }

    return {
      success: true,
      status: "COMPLETED",
      message: `Delivery address for order ${orderNumber} was successfully updated.`,
      orderNumber,
      previousAddress: oldAddress,
      newAddress,
      order: {
        ...updatedOrder,
        tracking: updatedOrder.courierTracking,
      },
    };
  } catch (error: unknown) {
    console.error("Defensive error in executeUpdateDeliveryAddress:", error);
    const msg = error instanceof Error ? error.message : "Database update error";
    return {
      success: false,
      status: "FAILED",
      error: `Failed to update delivery address due to a database error: ${msg}`,
    };
  }
}

// 4. Tool Executor: cancelOrder
export async function executeCancelOrder(args: {
  orderNumber: string;
  reason: string;
}) {
  try {
    const orderNumber =
      typeof args?.orderNumber === "string" ? args.orderNumber.trim().toUpperCase() : "";

    if (!orderNumber) {
      return {
        success: false,
        status: "FAILED",
        error: "Order number is required to cancel an order.",
      };
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return {
        success: false,
        status: "REJECTED",
        reason: `Order "${orderNumber}" was not found.`,
        error: `Order "${orderNumber}" was not found in our records.`,
      };
    }

    if (order.status === "CANCELLED") {
      return {
        success: false,
        status: "REJECTED",
        alreadyCancelled: true,
        reason: `Order ${orderNumber} has already been cancelled previously on ${
          order.cancelledAt ? order.cancelledAt.toLocaleDateString() : "file"
        }.`,
        error: `Order ${orderNumber} has already been cancelled.`,
      };
    }

    // Business rule guardrail: only PENDING or PROCESSING allowed
    if (order.status !== "PENDING" && order.status !== "PROCESSING") {
      return {
        success: false,
        status: "REJECTED",
        ruleViolation: true,
        currentStatus: order.status,
        reason: `Cancellation rejected: Order ${orderNumber} is currently "${order.status}". Dispatched shipments cannot be halted in-transit. You may initiate a return upon receipt.`,
        error: `Cancellation rejected: Order ${orderNumber} is currently "${order.status}". Dispatched shipments cannot be halted in-transit. You may initiate a return upon receipt.`,
      };
    }

    // Perform real transactional status mutation
    const updatedOrder = await prisma.order.update({
      where: { orderNumber },
      data: {
        status: "CANCELLED",
        cancelReason: args.reason || "Customer requested cancellation via AI Support",
        cancelledAt: new Date(),
      },
      include: { items: true, courierTracking: true },
    });

    // Record audit log defensively
    try {
      await prisma.auditLog.create({
        data: {
          orderId: order.id,
          action: "ORDER_CANCELLED",
          details: `Order cancelled by customer via AI Support. Reason: ${args.reason}`,
          performedBy: "AI_AGENT (Gemini Flash)",
        },
      });
    } catch (auditErr) {
      console.warn("Non-fatal: Failed to write audit log:", auditErr);
    }

    return {
      success: true,
      status: "COMPLETED",
      message: `Order ${orderNumber} has been successfully cancelled and a refund has been initiated.`,
      orderNumber,
      cancellationReason: args.reason,
      cancelledAt: updatedOrder.cancelledAt?.toISOString(),
      order: {
        ...updatedOrder,
        tracking: updatedOrder.courierTracking,
      },
    };
  } catch (error: unknown) {
    console.error("Defensive error in executeCancelOrder:", error);
    const msg = error instanceof Error ? error.message : "Database cancellation error";
    return {
      success: false,
      status: "FAILED",
      error: `Failed to cancel order due to a database error: ${msg}`,
    };
  }
}

// 5. Tool Executor: escalateToHumanAgent
export async function executeEscalateToHumanAgent(args: {
  orderNumber?: string;
  reason: string;
  urgency?: string;
}) {
  try {
    const orderNumber =
      typeof args?.orderNumber === "string" ? args.orderNumber.trim().toUpperCase() : undefined;
    let orderId: string | undefined = undefined;

    if (orderNumber) {
      const order = await prisma.order.findUnique({ where: { orderNumber } });
      if (order) orderId = order.id;
    }

    const urgency = args.urgency || "MEDIUM";
    const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await prisma.auditLog.create({
        data: {
          orderId,
          action: "ESCALATED",
          details: `Support ticket ${ticketId} created (${urgency} priority). Reason: ${args.reason}`,
          performedBy: "AI_AGENT (Gemini Flash)",
        },
      });
    } catch (auditErr) {
      console.warn("Non-fatal: Failed to write audit log:", auditErr);
    }

    return {
      success: true,
      status: "COMPLETED",
      ticketId,
      urgency,
      message: `A priority support ticket (${ticketId}) has been generated and assigned to human tier-2 logistics specialists.`,
    };
  } catch (error: unknown) {
    console.error("Defensive error in executeEscalateToHumanAgent:", error);
    const msg = error instanceof Error ? error.message : "Escalation error";
    return {
      success: false,
      status: "FAILED",
      error: `Failed to create escalation ticket: ${msg}`,
    };
  }
}

// Global Safe Tool Dispatcher
export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  try {
    switch (name) {
      case "getOrderDetails":
        return await executeGetOrderDetails(args as { orderNumber: string });
      case "getCourierStatus":
      case "trackCourier":
        return await executeGetCourierStatus(
          args as { orderNumber?: string; trackingNumber?: string }
        );
      case "updateDeliveryAddress":
        return await executeUpdateDeliveryAddress(
          args as {
            orderNumber: string;
            street: string;
            city: string;
            state: string;
            postalCode: string;
            country?: string;
          }
        );
      case "cancelOrder":
        return await executeCancelOrder(
          args as { orderNumber: string; reason: string }
        );
      case "escalateToHumanAgent":
        return await executeEscalateToHumanAgent(
          args as { orderNumber?: string; reason: string; urgency?: string }
        );
      default:
        return {
          success: false,
          status: "FAILED",
          error: `Unknown tool "${name}".`,
        };
    }
  } catch (err: unknown) {
    console.error(`Unhandled error inside executeTool for "${name}":`, err);
    const message = err instanceof Error ? err.message : "Unexpected tool execution error";
    return {
      success: false,
      status: "FAILED",
      error: `Error executing ${name}: ${message}`,
    };
  }
}
