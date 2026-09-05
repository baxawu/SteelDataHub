import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ============ SEED ADMIN (Section 39) ============
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error(
      "Thiếu SEED_ADMIN_PASSWORD trong .env — không được hard-code password trong code."
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "System Administrator",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      mustChangePassword: true, // Bắt buộc đổi password sau lần đăng nhập đầu tiên
    },
  });

  console.log(`Seeded admin: ${admin.email}`);

  // ============ SEED STANDARDS (Section 13) ============
  const standards = [
    { name: "ASTM", fullName: "American Society for Testing and Materials", region: "USA" },
    { name: "EN", fullName: "European Norm", region: "Europe" },
    { name: "JIS", fullName: "Japanese Industrial Standards", region: "Japan" },
    { name: "AS/NZS", fullName: "Australian/New Zealand Standard", region: "Australia" },
    { name: "GB/T", fullName: "Guobiao Standards", region: "China" },
    { name: "ISO", fullName: "International Organization for Standardization", region: "Global" },
  ];

  const standardMap: Record<string, string> = {};
  for (const s of standards) {
    const rec = await prisma.standard.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
    standardMap[s.name] = rec.id;
  }

  // ============ SEED CATEGORIES (Section 12) ============
  const categories = [
    { name: "Structural Steel", slug: "structural-steel" },
    { name: "Plate", slug: "plate" },
    { name: "Beam", slug: "beam" },
    { name: "Angle", slug: "angle" },
    { name: "Channel", slug: "channel" },
    { name: "Pipe", slug: "pipe" },
    { name: "Hollow Section", slug: "hollow-section" },
    { name: "Stainless Steel", slug: "stainless-steel" },
  ];

  const categoryMap: Record<string, string> = {};
  for (const c of categories) {
    const rec = await prisma.steelCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
    categoryMap[c.name] = rec.id;
  }

  // ============ SEED SAMPLE STEEL DATA (Section 27) ============
  // LƯU Ý: đây là dữ liệu Sample/Reference cho mục đích demo,
  // giá trị kỹ thuật cần được xác nhận lại từ nguồn chính thức trước khi dùng thực tế.
  const sampleSteel = [
    {
      name: "ASTM A36 — Sample/Reference Data",
      grade: "A36",
      code: "ASTM-A36",
      standard: "ASTM",
      category: "Structural Steel",
      materialType: "Carbon Steel",
      shape: "Plate",
      country: "USA",
      yieldStrength: 250,
      tensileStrength: 400,
      chemicalComposition: { C: 0.26, Mn: 1.0, Si: 0.4, P: 0.04, S: 0.05 },
    },
    {
      name: "EN S355J2 — Sample/Reference Data",
      grade: "S355J2",
      code: "EN-S355J2",
      standard: "EN",
      category: "Structural Steel",
      materialType: "Structural Steel",
      shape: "H-Beam",
      country: "Europe",
      yieldStrength: 355,
      tensileStrength: 510,
      chemicalComposition: { C: 0.2, Mn: 1.6, Si: 0.55, P: 0.025, S: 0.025 },
    },
    {
      name: "JIS SS400 — Sample/Reference Data",
      grade: "SS400",
      code: "JIS-SS400",
      standard: "JIS",
      category: "Plate",
      materialType: "Carbon Steel",
      shape: "Plate",
      country: "Japan",
      yieldStrength: 245,
      tensileStrength: 400,
      chemicalComposition: { C: 0.2, Mn: 1.5, P: 0.05, S: 0.05 },
    },
    {
      name: "GB/T Q355B — Sample/Reference Data",
      grade: "Q355B",
      code: "GBT-Q355B",
      standard: "GB/T",
      category: "Structural Steel",
      materialType: "Structural Steel",
      shape: "Angle",
      country: "China",
      yieldStrength: 355,
      tensileStrength: 470,
      chemicalComposition: { C: 0.2, Mn: 1.6, Si: 0.5, P: 0.03, S: 0.03 },
    },
  ];

  for (const s of sampleSteel) {
    await prisma.steelMaterial.upsert({
      where: { uniq_grade_standard: { grade: s.grade, standardId: standardMap[s.standard] } },
      update: {},
      create: {
        name: s.name,
        grade: s.grade,
        code: s.code,
        standardId: standardMap[s.standard],
        categoryId: categoryMap[s.category],
        materialType: s.materialType,
        shape: s.shape,
        country: s.country,
        yieldStrength: s.yieldStrength,
        tensileStrength: s.tensileStrength,
        chemicalComposition: s.chemicalComposition,
        status: "ACTIVE",
        createdById: admin.id,
      },
    });
  }

  console.log(`Seeded ${standards.length} standards, ${categories.length} categories, ${sampleSteel.length} sample steel records.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
