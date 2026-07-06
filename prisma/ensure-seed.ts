// Seeds the production database only if it's empty, so redeploys/restarts
// never wipe documents or shares created during a live review session.
import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log(`Database already has ${userCount} user(s) — skipping seed.`);
    return;
  }
  const seeded = await seedDatabase(prisma);
  console.log("Seeded users:", seeded);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
