import { prisma } from "./prisma";

export async function seedDatabase() {
  // Clear existing records in reverse dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.courierTracking.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});

  // Create primary demo customer
  const customer = await prisma.customer.create({
    data: {
      name: "Sarah Jenkins",
      email: "sarah.jenkins@example.com",
      phone: "+1 (555) 234-5678",
    },
  });

  // Order 1: PROCESSING (Address editable, Cancellable)
  await prisma.order.create({
    data: {
      orderNumber: "ORD-1001",
      customerId: customer.id,
      status: "PROCESSING",
      totalAmount: 189.99,
      currency: "USD",
      shippingStreet: "124 Main Street, Apt 4B",
      shippingCity: "Seattle",
      shippingState: "WA",
      shippingPostalCode: "98101",
      shippingCountry: "USA",
      items: {
        create: [
          {
            productName: "Ergonomic Wireless Mechanical Keyboard",
            sku: "KB-WL-RGB",
            quantity: 1,
            unitPrice: 119.99,
          },
          {
            productName: "Desk Mat Extra Large - Charcoal",
            sku: "MAT-XL-GRY",
            quantity: 2,
            unitPrice: 35.0,
          },
        ],
      },
      tracking: {
        create: {
          courierName: "FedEx Ground",
          trackingNumber: "FX-98214301",
          currentStatus: "Label Created",
          currentLocation: "Seattle Fulfillment Center, WA",
          estimatedDelivery: "In 2 days by 5:00 PM",
          eventsJson: JSON.stringify([
            {
              timestamp: "2026-10-21 09:15 AM",
              status: "Order Confirmed",
              location: "Online Store",
              description: "Order verified and sent to fulfillment center.",
            },
            {
              timestamp: "2026-10-21 11:30 AM",
              status: "Label Created",
              location: "Seattle Fulfillment Center, WA",
              description: "Shipping label created. Package awaiting carrier pickup.",
            },
          ]),
        },
      },
      auditLogs: {
        create: [
          {
            action: "ORDER_CREATED",
            details: "Order placed by customer via web checkout.",
            performedBy: "CUSTOMER",
          },
        ],
      },
    },
  });

  // Order 2: SHIPPED / OUT_FOR_DELIVERY (In Transit - Cannot cancel, Address locked)
  await prisma.order.create({
    data: {
      orderNumber: "ORD-1002",
      customerId: customer.id,
      status: "SHIPPED",
      totalAmount: 549.0,
      currency: "USD",
      shippingStreet: "789 Sunset Blvd, Suite 200",
      shippingCity: "Los Angeles",
      shippingState: "CA",
      shippingPostalCode: "90028",
      shippingCountry: "USA",
      items: {
        create: [
          {
            productName: "4K Ultra-HD 27\" Designer Monitor",
            sku: "DISP-4K-27",
            quantity: 1,
            unitPrice: 549.0,
          },
        ],
      },
      tracking: {
        create: {
          courierName: "DHL Express",
          trackingNumber: "DHL-88349102",
          currentStatus: "Out for Delivery",
          currentLocation: "Los Angeles Hub, CA",
          estimatedDelivery: "Today by 2:30 PM",
          eventsJson: JSON.stringify([
            {
              timestamp: "2026-10-19 02:20 PM",
              status: "Picked Up",
              location: "Ontario Distribution Hub, CA",
              description: "Shipment picked up by courier driver.",
            },
            {
              timestamp: "2026-10-20 06:15 AM",
              status: "In Transit",
              location: "Los Angeles Sorting Center, CA",
              description: "Processed through sorting facility.",
            },
            {
              timestamp: "2026-10-21 08:30 AM",
              status: "Out for Delivery",
              location: "Los Angeles Hub, CA",
              description: "With courier for final delivery to address.",
            },
          ]),
        },
      },
      auditLogs: {
        create: [
          {
            action: "ORDER_DISPATCHED",
            details: "Package handed over to DHL Express.",
            performedBy: "FULFILLMENT_SYSTEM",
          },
        ],
      },
    },
  });

  // Order 3: DELIVERED
  await prisma.order.create({
    data: {
      orderNumber: "ORD-1003",
      customerId: customer.id,
      status: "DELIVERED",
      totalAmount: 79.5,
      currency: "USD",
      shippingStreet: "320 Pine Street",
      shippingCity: "Austin",
      shippingState: "TX",
      shippingPostalCode: "78701",
      shippingCountry: "USA",
      items: {
        create: [
          {
            productName: "Braided USB-C Cable 3-Pack (6ft)",
            sku: "ACC-CBL-3PK",
            quantity: 1,
            unitPrice: 29.5,
          },
          {
            productName: "65W GaN Fast Wall Charger",
            sku: "ACC-CHG-65W",
            quantity: 1,
            unitPrice: 50.0,
          },
        ],
      },
      tracking: {
        create: {
          courierName: "UPS Ground",
          trackingNumber: "UPS-41209384",
          currentStatus: "Delivered",
          currentLocation: "Front Porch, Austin, TX",
          estimatedDelivery: "Delivered on Oct 18",
          eventsJson: JSON.stringify([
            {
              timestamp: "2026-10-17 10:00 AM",
              status: "Picked Up",
              location: "Dallas Logistics Center, TX",
              description: "Package received by carrier.",
            },
            {
              timestamp: "2026-10-18 12:45 PM",
              status: "Delivered",
              location: "Austin, TX",
              description: "Delivered to front porch. Left at front door.",
            },
          ]),
        },
      },
    },
  });

  // Order 4: CANCELLED
  await prisma.order.create({
    data: {
      orderNumber: "ORD-1004",
      customerId: customer.id,
      status: "CANCELLED",
      totalAmount: 120.0,
      currency: "USD",
      shippingStreet: "55 Ocean Drive",
      shippingCity: "Miami",
      shippingState: "FL",
      shippingPostalCode: "33139",
      shippingCountry: "USA",
      cancelReason: "Customer requested cancellation prior to warehouse dispatch",
      cancelledAt: new Date("2026-10-15T14:30:00Z"),
      items: {
        create: [
          {
            productName: "Active Noise Cancelling Earbuds",
            sku: "AUD-EAR-ANC",
            quantity: 1,
            unitPrice: 120.0,
          },
        ],
      },
    },
  });

  return { success: true, count: 4 };
}
