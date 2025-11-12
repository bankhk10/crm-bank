import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.employee.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  const [adminPassword, managerPassword, sellerPassword] = await Promise.all([
    hash("admin123", 12),
    hash("manager123", 12),
    hash("seller123", 12)
  ]);

  const admin = await prisma.user.create({
    data: {
      name: "Somsak Admin",
      email: "admin@move-crm.local",
      password: adminPassword,
      role: "ADMIN"
    }
  });

  const manager = await prisma.user.create({
    data: {
      name: "Nok Manager",
      email: "manager@move-crm.local",
      password: managerPassword,
      role: "MANAGER"
    }
  });

  const seller = await prisma.user.create({
    data: {
      name: "View Seller",
      email: "seller@move-crm.local",
      password: sellerPassword,
      role: "USER"
    }
  });

  const acme = await prisma.company.create({
    data: {
      name: "Acme Holdings",
      industry: "Financial Services",
      status: "ACTIVE",
      employees: {
        create: [
          {
            name: "Ploy Saetang",
            email: "ploy@acme.local",
            role: "Customer Success",
            phone: "+66 02-123-4567",
            manager: { connect: { id: manager.id } }
          },
          {
            name: "Golf Jirasak",
            email: "golf@acme.local",
            role: "Account Executive",
            phone: "+66 02-555-4567",
            manager: { connect: { id: seller.id } }
          }
        ]
      }
    }
  });

  await prisma.company.create({
    data: {
      name: "Globex Asia",
      industry: "Technology",
      status: "PROSPECT",
      employees: {
        create: [
          {
            name: "Mint Chanakarn",
            email: "mint@globex.local",
            role: "Business Analyst",
            phone: "+66 02-987-0000",
            manager: { connect: { id: manager.id } }
          }
        ]
      }
    }
  });

  await prisma.employee.create({
    data: {
      name: "Boat Phurin",
      email: "boat@move-crm.local",
      role: "Pre-Sales Engineer",
      phone: "+66 081-222-3344",
      manager: { connect: { id: admin.id } },
      company: { connect: { id: acme.id } }
    }
  });
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
