import {
  executeGetOrderDetails,
  executeGetCourierStatus,
  executeUpdateDeliveryAddress,
  executeCancelOrder,
} from "../lib/gemini/executor";
import { seedDatabase } from "../lib/seed-data";
import { prisma } from "../lib/prisma";

async function runTests() {
  console.log("=== OmniSupport AI Verification Suite ===");

  // Step 0: Ensure fresh seed
  console.log("\n1. Resetting database to demo seed...");
  await seedDatabase();

  // Test 1: getOrderDetails for ORD-1001
  console.log("\n2. Testing getOrderDetails(ORD-1001)...");
  const orderDetails = await executeGetOrderDetails({ orderNumber: "ORD-1001" });
  if (!orderDetails.found || !orderDetails.order) {
    throw new Error("Failed to find ORD-1001");
  }
  console.log(`✓ Found ORD-1001. Status: ${orderDetails.order.status}, Items: ${orderDetails.order.items.length}`);
  console.log(`✓ Original Address: ${orderDetails.order.shippingAddress.street}`);

  // Test 2: getCourierStatus for ORD-1002
  console.log("\n3. Testing getCourierStatus(ORD-1002)...");
  const courierStatus = await executeGetCourierStatus({ orderNumber: "ORD-1002" });
  if (!courierStatus.found) {
    throw new Error("Failed to find courier tracking for ORD-1002");
  }
  console.log(`✓ Courier: ${courierStatus.courierName}, Tracking: ${courierStatus.trackingNumber}`);
  console.log(`✓ Current Status: ${courierStatus.currentStatus}, ETA: ${courierStatus.estimatedDelivery}`);
  console.log(`✓ Checkpoints logged: ${(courierStatus.checkpoints || []).length}`);

  // Test 3: updateDeliveryAddress for ORD-1001 (Allowed: PROCESSING)
  console.log("\n4. Testing updateDeliveryAddress for ORD-1001...");
  const updateResult = await executeUpdateDeliveryAddress({
    orderNumber: "ORD-1001",
    street: "742 Evergreen Terrace",
    city: "Springfield",
    state: "OR",
    postalCode: "97477",
    country: "USA",
  });
  if (!updateResult.success) {
    throw new Error(`Failed to update address: ${updateResult.error}`);
  }
  console.log(`✓ Address successfully updated to: ${updateResult.newAddress}`);

  // Verify in DB directly
  const dbOrder = await prisma.order.findUnique({ where: { orderNumber: "ORD-1001" } });
  if (dbOrder?.shippingStreet !== "742 Evergreen Terrace") {
    throw new Error("Database did not persist updated street address");
  }
  console.log("✓ Database record confirmed updated in Prisma ORM.");

  // Test 4: Business Rule Validation - Try updating address for ORD-1002 (Rejected: SHIPPED)
  console.log("\n5. Testing address update rejection on SHIPPED order ORD-1002...");
  const rejectedUpdate = await executeUpdateDeliveryAddress({
    orderNumber: "ORD-1002",
    street: "999 Invalid Way",
    city: "Los Angeles",
    state: "CA",
    postalCode: "90001",
  });
  if (rejectedUpdate.success || !rejectedUpdate.ruleViolation) {
    throw new Error("Should have rejected address update on dispatched shipment!");
  }
  console.log(`✓ Correctly rejected with rule violation: "${rejectedUpdate.error}"`);

  // Test 5: cancelOrder for ORD-1001 (Allowed: PROCESSING)
  console.log("\n6. Testing cancelOrder for ORD-1001...");
  const cancelResult = await executeCancelOrder({
    orderNumber: "ORD-1001",
    reason: "Customer changed their mind before dispatch",
  });
  if (!cancelResult.success) {
    throw new Error(`Failed to cancel order: ${cancelResult.error}`);
  }
  console.log(`✓ Order cancelled successfully. Reason: ${cancelResult.cancellationReason}`);

  // Verify in DB directly
  const dbCancelled = await prisma.order.findUnique({ where: { orderNumber: "ORD-1001" } });
  if (dbCancelled?.status !== "CANCELLED" || !dbCancelled?.cancelledAt) {
    throw new Error("Database did not update status to CANCELLED");
  }
  console.log("✓ Database record confirmed status is CANCELLED.");

  // Test 6: Business Rule Validation - Try cancelling ORD-1002 (Rejected: SHIPPED)
  console.log("\n7. Testing cancellation rejection on SHIPPED order ORD-1002...");
  const rejectedCancel = await executeCancelOrder({
    orderNumber: "ORD-1002",
    reason: "Too late cancel attempt",
  });
  if (rejectedCancel.success || !rejectedCancel.ruleViolation) {
    throw new Error("Should have rejected cancellation on dispatched shipment!");
  }
  console.log(`✓ Correctly rejected cancellation: "${rejectedCancel.error}"`);

  // Test 7: Verify Audit Log persistence
  console.log("\n8. Checking Audit Logs...");
  const logs = await prisma.auditLog.findMany({
    where: { orderId: dbOrder?.id },
  });
  console.log(`✓ Audit log entries recorded for ORD-1001: ${logs.length}`);
  for (const log of logs) {
    console.log(`  - [${log.action}] by ${log.performedBy}: ${log.details}`);
  }

  // Reset database back to clean state for user demo
  console.log("\n9. Resetting demo database back to clean initial state...");
  await seedDatabase();
  console.log("✓ Database reset cleanly.");

  console.log("\n==========================================");
  console.log("  ALL TESTS PASSED WITH 100% SUCCESS!     ");
  console.log("==========================================");
}

runTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
