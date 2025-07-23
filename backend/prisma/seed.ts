// Path: backend/prisma/seed.ts
import { PrismaClient, UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Inisialisasi Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- Buat Platform Admin ---
  const adminEmail = 'admin@platform.com';
  const adminPassword = 'adminpassword'; // Ganti dengan password yang kuat di produksi

  // Cek apakah admin sudah ada
  const adminExists = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminExists) {
    // Hash password admin
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Buat user admin
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        userType: UserType.platform_admin,
        // institutionId sengaja dibiarkan null karena ini admin platform
      },
    });
    console.log(`✅ Created platform admin with email: ${adminEmail}`);
  } else {
    console.log(`ℹ️ Platform admin with email '${adminEmail}' already exists.`);
  }

  console.log('Seeding finished.');
}

// Jalankan fungsi main dan pastikan koneksi ditutup
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
