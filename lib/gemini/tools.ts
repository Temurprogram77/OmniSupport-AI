import { Type, FunctionDeclaration } from "@google/genai";

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
   - Always check the order first or call 'updateDeliveryAddress'.
   - Note: Address changes are ONLY permitted if the order is still PENDING or PROCESSING.
   - If the order has already SHIPPED or is OUT_FOR_DELIVERY, politely explain that the parcel has already left the warehouse and is in the carrier's custody, so the address cannot be directly changed.
4. When a customer asks to cancel an order:
   - Call 'cancelOrder' with the order number and reason.
   - Note: Cancellations are ONLY permitted for orders in PENDING or PROCESSING status.
   - If the order has already SHIPPED or is DELIVERED, explain that the shipment cannot be intercepted, but provide instructions on how they can initiate a return once delivered.
5. If the user presents an edge case (e.g., package stolen, damaged, extreme delay), offer to escalate via 'escalateToHumanAgent'.
6. Maintain a professional, helpful, and concise tone. Format key information like tracking numbers, order numbers, amounts, and dates clearly.
`;
