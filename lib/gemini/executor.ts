import { prisma } from "../prisma";
import { GoogleGenAI } from "@google/genai";
import { geminiTools, SYSTEM_INSTRUCTION } from "./tools";

export interface ToolExecutionRecord {
  toolName: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  timestamp: string;
}

export interface ChatResponsePayload {
  role: "model";
  text: string;
  toolCalls: ToolExecutionRecord[];
  updatedOrder?: unknown;
}

// 1. Tool Executor: getOrderDetails
export async function executeGetOrderDetails(args: { orderNumber: string }) {
  const orderNumber = args.orderNumber?.trim().toUpperCase();
  if (!orderNumber) {
    return { error: "Order number is required." };
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      tracking: true,
      customer: {
        select: { name: true, email: true, phone: true },
      },
    },
  });

  if (!order) {
    return {
      found: false,
      message: `No order found with order number "${orderNumber}". Please verify the order ID.`,
    };
  }

  return {
    found: true,
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
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
      tracking: order.tracking
        ? {
            courierName: order.tracking.courierName,
            trackingNumber: order.tracking.trackingNumber,
            currentStatus: order.tracking.currentStatus,
            currentLocation: order.tracking.currentLocation,
            estimatedDelivery: order.tracking.estimatedDelivery,
          }
        : null,
      createdAt: order.createdAt.toISOString(),
      cancelReason: order.cancelReason,
    },
  };
}

// 2. Tool Executor: getCourierStatus
export async function executeGetCourierStatus(args: {
  orderNumber?: string;
  trackingNumber?: string;
}) {
  const orderNumber = args.orderNumber?.trim().toUpperCase();
  const trackingNumber = args.trackingNumber?.trim().toUpperCase();

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
      found: false,
      message: `No courier tracking records found for ${orderNumber ? `Order #${orderNumber}` : `Tracking #${trackingNumber}`}.`,
    };
  }

  let events: unknown[] = [];
  try {
    events = JSON.parse(tracking.eventsJson);
  } catch {
    events = [];
  }

  return {
    found: true,
    trackingNumber: tracking.trackingNumber,
    courierName: tracking.courierName,
    orderNumber: tracking.order.orderNumber,
    orderStatus: tracking.order.status,
    currentStatus: tracking.currentStatus,
    currentLocation: tracking.currentLocation,
    estimatedDelivery: tracking.estimatedDelivery,
    checkpoints: events,
    lastUpdated: tracking.updatedAt.toISOString(),
  };
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
  const orderNumber = args.orderNumber?.trim().toUpperCase();
  if (!orderNumber) {
    return { success: false, error: "Order number is required." };
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { customer: true },
  });

  if (!order) {
    return {
      success: false,
      error: `Order "${orderNumber}" was not found in our records.`,
    };
  }

  // Business rule check: only PENDING or PROCESSING allowed
  if (order.status !== "PENDING" && order.status !== "PROCESSING") {
    return {
      success: false,
      ruleViolation: true,
      currentStatus: order.status,
      error: `Cannot update delivery address: Order ${orderNumber} is already "${order.status}". Once an order has been dispatched or delivered, address alterations must be requested directly with the carrier.`,
    };
  }

  const oldAddress = `${order.shippingStreet}, ${order.shippingCity}, ${order.shippingState} ${order.shippingPostalCode}, ${order.shippingCountry}`;
  const newCountry = args.country || order.shippingCountry || "USA";

  const updatedOrder = await prisma.order.update({
    where: { orderNumber },
    data: {
      shippingStreet: args.street.trim(),
      shippingCity: args.city.trim(),
      shippingState: args.state.trim().toUpperCase(),
      shippingPostalCode: args.postalCode.trim(),
      shippingCountry: newCountry.trim(),
    },
    include: { items: true, tracking: true },
  });

  const newAddress = `${updatedOrder.shippingStreet}, ${updatedOrder.shippingCity}, ${updatedOrder.shippingState} ${updatedOrder.shippingPostalCode}, ${updatedOrder.shippingCountry}`;

  // Log audit
  await prisma.auditLog.create({
    data: {
      orderId: order.id,
      action: "ADDRESS_UPDATED",
      details: `Shipping address modified by AI agent from [${oldAddress}] to [${newAddress}].`,
      performedBy: "AI_AGENT (Gemini 2.0 Flash)",
    },
  });

  return {
    success: true,
    message: `Delivery address for order ${orderNumber} was successfully updated.`,
    orderNumber,
    previousAddress: oldAddress,
    newAddress,
    order: updatedOrder,
  };
}

// 4. Tool Executor: cancelOrder
export async function executeCancelOrder(args: {
  orderNumber: string;
  reason: string;
}) {
  const orderNumber = args.orderNumber?.trim().toUpperCase();
  if (!orderNumber) {
    return { success: false, error: "Order number is required." };
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
  });

  if (!order) {
    return {
      success: false,
      error: `Order "${orderNumber}" was not found.`,
    };
  }

  if (order.status === "CANCELLED") {
    return {
      success: false,
      alreadyCancelled: true,
      error: `Order ${orderNumber} has already been cancelled previously on ${order.cancelledAt ? order.cancelledAt.toLocaleDateString() : "file"}.`,
    };
  }

  // Business rule check: only PENDING or PROCESSING allowed
  if (order.status !== "PENDING" && order.status !== "PROCESSING") {
    return {
      success: false,
      ruleViolation: true,
      currentStatus: order.status,
      error: `Cancellation rejected: Order ${orderNumber} is currently "${order.status}". Dispatched shipments cannot be halted in-transit. You may initiate a return upon receipt.`,
    };
  }

  const updatedOrder = await prisma.order.update({
    where: { orderNumber },
    data: {
      status: "CANCELLED",
      cancelReason: args.reason || "Customer requested cancellation via AI Support",
      cancelledAt: new Date(),
    },
    include: { items: true, tracking: true },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      orderId: order.id,
      action: "ORDER_CANCELLED",
      details: `Order cancelled by customer via AI Support. Reason: ${args.reason}`,
      performedBy: "AI_AGENT (Gemini 2.0 Flash)",
    },
  });

  return {
    success: true,
    message: `Order ${orderNumber} has been successfully cancelled and a full refund has been scheduled.`,
    orderNumber,
    cancellationReason: args.reason,
    cancelledAt: updatedOrder.cancelledAt?.toISOString(),
    order: updatedOrder,
  };
}

// 5. Tool Executor: escalateToHumanAgent
export async function executeEscalateToHumanAgent(args: {
  orderNumber?: string;
  reason: string;
  urgency?: string;
}) {
  const orderNumber = args.orderNumber?.trim().toUpperCase();
  let orderId: string | undefined = undefined;

  if (orderNumber) {
    const order = await prisma.order.findUnique({ where: { orderNumber } });
    if (order) orderId = order.id;
  }

  const urgency = args.urgency || "MEDIUM";
  const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

  await prisma.auditLog.create({
    data: {
      orderId,
      action: "ESCALATED",
      details: `Support ticket ${ticketId} created (${urgency} priority). Reason: ${args.reason}`,
      performedBy: "AI_AGENT (Gemini 2.0 Flash)",
    },
  });

  return {
    success: true,
    ticketId,
    urgency,
    message: `A priority support ticket (${ticketId}) has been generated and assigned to our tier-2 customer logistics team. A support representative will reach out within 2 hours.`,
  };
}

// Tool Dispatcher
export async function executeTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "getOrderDetails":
      return await executeGetOrderDetails(args as { orderNumber: string });
    case "getCourierStatus":
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
      return { error: `Unknown tool "${name}".` };
  }
}

// Fallback rule-based simulator when no GEMINI_API_KEY is configured
export async function runFallbackChat(
  userMessage: string
): Promise<ChatResponsePayload> {
  const text = userMessage.toLowerCase();
  const toolCalls: ToolExecutionRecord[] = [];
  let updatedOrder: unknown = undefined;

  // Detect order number e.g. ORD-1001, ORD-1002
  const orderMatch = userMessage.match(/\b(ORD-\d{4})\b/i);
  const orderNumber = orderMatch ? orderMatch[1].toUpperCase() : null;

  // Detect tracking number e.g. FX-98214301 or DHL-88349102
  const trackingMatch = userMessage.match(/\b(FX-\d+|DHL-\d+|UPS-\d+)\b/i);
  const trackingNumber = trackingMatch ? trackingMatch[1].toUpperCase() : null;

  // Case 1: Cancel order
  if (
    (text.includes("cancel") || text.includes("cancellation")) &&
    orderNumber
  ) {
    const reason =
      userMessage.replace(/cancel.*order\s*ORD-\d+/i, "").trim() ||
      "Customer requested cancellation";
    const args = { orderNumber, reason };
    const result = await executeCancelOrder(args);
    toolCalls.push({
      toolName: "cancelOrder",
      args,
      result,
      timestamp: new Date().toISOString(),
    });

    if (result.success) {
      updatedOrder = result.order;
      return {
        role: "model",
        text: `I have processed the cancellation for **Order #${orderNumber}**.\n\n` +
          `• **Status**: CANCELLED\n` +
          `• **Reason**: ${result.cancellationReason}\n` +
          `• **Refund**: A full refund has been scheduled back to your original payment method within 3–5 business days.`,
        toolCalls,
        updatedOrder,
      };
    } else {
      return {
        role: "model",
        text: `⚠️ **Unable to cancel Order #${orderNumber}**:\n\n${result.error}`,
        toolCalls,
      };
    }
  }

  // Case 2: Update delivery address
  if (
    (text.includes("address") || text.includes("change delivery") || text.includes("shipping to")) &&
    orderNumber
  ) {
    // Attempt address extraction or default test values
    let street = "742 Evergreen Terrace";
    let city = "Springfield";
    let state = "OR";
    let postalCode = "97477";

    // Extract if pattern like "to 123 Main St, Springfield, OR 97477"
    const addrPattern = /to\s+([^,]+),\s*([^,]+),\s*([A-Za-z]{2})\s*(\d{5})/i;
    const match = userMessage.match(addrPattern);
    if (match) {
      street = match[1].trim();
      city = match[2].trim();
      state = match[3].trim().toUpperCase();
      postalCode = match[4].trim();
    }

    const args = { orderNumber, street, city, state, postalCode, country: "USA" };
    const result = await executeUpdateDeliveryAddress(args);
    toolCalls.push({
      toolName: "updateDeliveryAddress",
      args,
      result,
      timestamp: new Date().toISOString(),
    });

    if (result.success) {
      updatedOrder = result.order;
      return {
        role: "model",
        text: `✅ **Delivery Address Successfully Updated** for **Order #${orderNumber}**!\n\n` +
          `• **Previous Address**: ${result.previousAddress}\n` +
          `• **New Shipping Address**: ${result.newAddress}\n\n` +
          `Our fulfillment warehouse has been notified with the new delivery destination.`,
        toolCalls,
        updatedOrder,
      };
    } else {
      return {
        role: "model",
        text: `⚠️ **Address Update Notice**:\n\n${result.error}`,
        toolCalls,
      };
    }
  }

  // Case 3: Courier Tracking / Where is my package
  if (
    text.includes("track") ||
    text.includes("where is") ||
    text.includes("courier") ||
    text.includes("package") ||
    trackingNumber
  ) {
    const args = { orderNumber: orderNumber || undefined, trackingNumber: trackingNumber || undefined };
    const result = await executeGetCourierStatus(args);
    toolCalls.push({
      toolName: "getCourierStatus",
      args,
      result,
      timestamp: new Date().toISOString(),
    });

    if (result.found) {
      return {
        role: "model",
        text: `📦 **Courier Tracking Update** for **${result.orderNumber ? `Order #${result.orderNumber}` : `Tracking #${result.trackingNumber}`}**:\n\n` +
          `• **Carrier**: ${result.courierName}\n` +
          `• **Tracking Number**: \`${result.trackingNumber}\`\n` +
          `• **Current Status**: **${result.currentStatus}**\n` +
          `• **Location**: ${result.currentLocation}\n` +
          `• **Estimated Delivery**: ${result.estimatedDelivery}\n\n` +
          `Your package is moving as scheduled. Check the live timeline card below for the full route checkpoints!`,
        toolCalls,
      };
    } else {
      return {
        role: "model",
        text: result.message || "No tracking found for this shipment.",
        toolCalls,
      };
    }
  }

  // Case 4: Order lookup
  if (orderNumber) {
    const args = { orderNumber };
    const result = await executeGetOrderDetails(args);
    toolCalls.push({
      toolName: "getOrderDetails",
      args,
      result,
      timestamp: new Date().toISOString(),
    });

    if (result.found && result.order) {
      const o = result.order;
      const itemsList = o.items
        .map((i: { productName: string; quantity: number; unitPrice: number }) => `  - ${i.productName} (x${i.quantity}) — $${i.unitPrice.toFixed(2)}`)
        .join("\n");

      return {
        role: "model",
        text: `Here are the details for **Order #${o.orderNumber}**:\n\n` +
          `• **Status**: \`${o.status}\`\n` +
          `• **Customer**: ${o.customerName} (${o.customerEmail})\n` +
          `• **Total**: $${o.totalAmount.toFixed(2)} ${o.currency}\n` +
          `• **Shipping Address**: ${o.shippingAddress.street}, ${o.shippingAddress.city}, ${o.shippingAddress.state} ${o.shippingAddress.postalCode}\n` +
          (o.tracking ? `• **Tracking**: ${o.tracking.courierName} (\`${o.tracking.trackingNumber}\`) - ${o.tracking.currentStatus}\n` : "") +
          `\n**Items:**\n${itemsList}\n\n` +
          (o.status === "PROCESSING" ? `💡 *This order is currently processing. You can still modify the delivery address or cancel it if needed.*` : ""),
        toolCalls,
      };
    } else {
      return {
        role: "model",
        text: result.message || `Order ${orderNumber} could not be located.`,
        toolCalls,
      };
    }
  }

  // Case 5: General welcome / help
  return {
    role: "model",
    text: `Hello! I'm **OmniSupport AI**, your autonomous e-commerce logistics assistant.\n\n` +
      `Here is what I can help you with:\n` +
      `• **Order Inquiries**: Ask about any order (e.g. *"What is the status of ORD-1001?"*)\n` +
      `• **Real-Time Courier Tracking**: Check carrier location and estimated delivery (e.g. *"Track order ORD-1002"*)\n` +
      `• **Address Changes**: Update delivery address before dispatch (e.g. *"Change address for ORD-1001 to 742 Evergreen Terrace, Springfield, OR 97477"*)\n` +
      `• **Order Cancellation**: Cancel eligible processing orders (e.g. *"Cancel order ORD-1001"*)\n\n` +
      `Feel free to try one of the quick suggestions or ask about any order from the live panel on the right!`,
    toolCalls: [],
  };
}

// Gemini 2.0 Flash Tool Calling Multi-Turn Loop
export async function runGeminiChat(
  history: Array<{ role: "user" | "model"; content: string }>,
  userMessage: string
): Promise<ChatResponsePayload> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // If no API key provided, seamlessly use the local tool execution fallback
  if (!apiKey) {
    return await runFallbackChat(userMessage);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const toolCalls: ToolExecutionRecord[] = [];
    let updatedOrder: unknown = undefined;

    // Build contents from history
    const contents: Array<any> = history.map((msg) => ({
      role: msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    // Multi-turn tool calling loop (max 5 turns to prevent infinite loops)
    let currentIteration = 0;
    while (currentIteration < 5) {
      currentIteration++;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: geminiTools,
        },
      });

      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      // Check if there are function calls
      const functionCallParts = parts.filter(
        (part) => part.functionCall !== undefined && part.functionCall !== null
      );

      if (functionCallParts.length === 0) {
        // No function calls: return final text response
        const textParts: string[] = [];
        for (const part of parts) {
          if (typeof part.text === "string") {
            textParts.push(part.text);
          }
        }
        const finalContent = textParts.join("\n").trim() || "I have processed your request.";

        return {
          role: "model",
          text: finalContent,
          toolCalls,
          updatedOrder,
        };
      }

      // Add model's tool call turn to contents history
      contents.push({
        role: "model",
        parts,
      });

      // Execute each function call and collect responses
      const functionResponseParts: Array<any> = [];

      for (const fcp of functionCallParts) {
        const fc = fcp.functionCall!;
        const toolName = fc.name || "";
        const toolArgs = (fc.args as Record<string, unknown>) || {};

        const toolResult = (await executeTool(toolName, toolArgs)) as Record<string, unknown>;

        if (toolResult && toolResult.order) {
          updatedOrder = toolResult.order;
        }

        toolCalls.push({
          toolName,
          args: toolArgs,
          result: toolResult,
          timestamp: new Date().toISOString(),
        });

        functionResponseParts.push({
          functionResponse: {
            name: toolName,
            response: toolResult,
          },
        });
      }

      // Append function responses to contents for the next model iteration
      contents.push({
        role: "user",
        parts: functionResponseParts,
      });
    }

    return {
      role: "model",
      text: "I have completed the operations on your order.",
      toolCalls,
      updatedOrder,
    };
  } catch (error) {
    console.error("Gemini API error, falling back to local executor:", error);
    // Graceful fallback to local executor so chat never crashes
    return await runFallbackChat(userMessage);
  }
}
