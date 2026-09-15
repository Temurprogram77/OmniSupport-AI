import { seedDatabase } from "../lib/seed-data";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Seeding OmniSupport AI database...");
  await seedDatabase();
  console.log("Database seeded successfully with 4 sample orders!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
