import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const gis = await db.school.upsert({
    where: { id: "school-gis" },
    update: {},
    create: {
      id: "school-gis",
      name: "GIS Gaborone",
      location: "Gaborone, Botswana",
    },
  });

  const hash = await bcrypt.hash("admin123", 12);

  await db.user.upsert({
    where: { email: "ops@advtech.bw" },
    update: {},
    create: {
      email: "ops@advtech.bw",
      name: "Operations Manager",
      password: hash,
      role: "OPS_MANAGER",
      schoolId: null,
    },
  });

  await db.user.upsert({
    where: { email: "admin@gis.advtech.bw" },
    update: {},
    create: {
      email: "admin@gis.advtech.bw",
      name: "GIS Admin",
      password: hash,
      role: "ADMIN",
      schoolId: gis.id,
    },
  });

  console.log("Seed complete");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
