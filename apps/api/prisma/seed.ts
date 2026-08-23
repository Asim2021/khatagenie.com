import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting KhataGenie Database Seed...');

  // 1. Clean all existing records
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // 2. Create CA Firm Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Bansal & Associates CA',
      firmGstin: '07AAACB1234F1Z1',
      phone: '+919810012345',
      email: 'contact@bansalca.com',
      address: 'Suite 402, Statesman House, Barakhamba Road, Connaught Place, New Delhi 110001',
      subscriptionTier: 'pro',
      featureOverrides: {
        feature_whatsapp_ingestion: true,
        feature_ai_vision_extraction: true,
        feature_split_screen_review: true,
        feature_tally_xml_export: true,
        feature_excel_export: true,
        feature_direct_upload: true,
        feature_advanced_gstin_validation: true,
        feature_bulk_approval: true,
        feature_multi_page_pdf: true,
        feature_cloud_storage_r2: true,
        feature_async_extraction_queue: true,
        feature_gstr2b_reconciliation: true,
        feature_whatsapp_interactive_bot: true,
        feature_busy_accounting_export: true,
      },
    },
  });
  console.log(`🏢 Created Organization: ${org.name} (${org.id})`);

  // 3. Create 1 Admin User
  const adminPasswordHash = await bcrypt.hash('Asim@123', 10);
  const adminUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'admin@khatagenie.com',
      passwordHash: adminPasswordHash,
      fullName: 'CA Rajesh Bansal (Admin)',
      role: Role.CA_ADMIN,
    },
  });
  console.log(`👤 Created Admin User: ${adminUser.fullName} (${adminUser.email})`);

  // 4. Create 1 End User
  const staffPasswordHash = await bcrypt.hash('Asim@123', 10);
  const endUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'user@khatagenie.com',
      passwordHash: staffPasswordHash,
      fullName: 'Suresh Sharma (Staff Accountant)',
      role: Role.CA_STAFF,
    },
  });
  console.log(`👤 Created End User: ${endUser.fullName} (${endUser.email})`);

  console.log('\n✅ Database Seed Completed Successfully!');
  console.log('--------------------------------------------------');
  console.log('Admin Account: admin@khatagenie.com / Asim@123');
  console.log('End User Account: user@khatagenie.com / Asim@123');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
