import { PrismaClient, Role, InvoiceStatus, InvoiceType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting KhataGenie Database Seed...');

  // 1. Clean existing records
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

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
      },
    },
  });
  console.log(`Created Organization: ${org.name} (${org.id})`);

  // 3. Create CA Admin User
  const passwordHash = await bcrypt.hash('KhataGenie@2026', 10);
  const adminUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'admin@khatagenie.com',
      passwordHash,
      fullName: 'CA Rajesh Bansal, FCA',
      role: Role.CA_ADMIN,
    },
  });
  console.log(`Created User: ${adminUser.fullName} (${adminUser.email})`);

  // 4. Create MSME Clients
  const client1 = await prisma.client.create({
    data: {
      organizationId: org.id,
      businessName: 'Aggarwal Traders',
      tradeName: 'Aggarwal Wholesale Hub',
      gstin: '07AABCA1111A1Z0',
      pan: 'AABCA1111A',
      contactPerson: 'Suresh Aggarwal',
      whatsappPhone: '919811223344',
      tallyLedgerName: 'Aggarwal Traders - Purchase A/c',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      organizationId: org.id,
      businessName: 'Sharma Electronics & Appliances',
      tradeName: 'Sharma Digital Store',
      gstin: '07BBCDE2222B1Z8',
      pan: 'BBCDE2222B',
      contactPerson: 'Amit Sharma',
      whatsappPhone: '919877665544',
      tallyLedgerName: 'Sharma Electronics - Purchase A/c',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      organizationId: org.id,
      businessName: 'Gupta Auto Components',
      tradeName: 'Gupta Motors Delhi',
      gstin: '07CCDEF3333C1Z6',
      pan: 'CCDEF3333C',
      contactPerson: 'Vikas Gupta',
      whatsappPhone: '919899112233',
      tallyLedgerName: 'Gupta Auto - Raw Material A/c',
    },
  });
  console.log('Created 3 MSME Clients');

  // 5. Create Sample Invoices
  // Invoice 1: Approved Intra-state Tax Invoice
  const invoice1 = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: client1.id,
      senderPhone: '919811223344',
      whatsappMessageId: 'wamid.HBgMOTE5ODExMjIzMzQ0FQIAEhggMTIzNDU2Nzg5MAA=',
      fileUrl: '/uploads/sample_inv_01.jpg',
      fileMimeType: 'image/jpeg',
      fileSizeBytes: 425120,
      status: InvoiceStatus.APPROVED,
      invoiceType: InvoiceType.B2B_TAX_INVOICE,
      invoiceNumber: 'INV-2026-0891',
      invoiceDate: new Date('2026-08-15'),
      supplierName: 'Om Prakash Stationery & Supplies',
      supplierGstin: '07DDDDE4444D1Z2',
      supplierPan: 'DDDDE4444D',
      supplierAddress: 'Nai Sarak, Chandni Chowk, Delhi 110006',
      buyerGstin: client1.gstin,
      taxableAmount: 10000.00,
      cgstAmount: 900.00,
      sgstAmount: 900.00,
      igstAmount: 0.00,
      cessAmount: 0.00,
      roundOffAmount: 0.00,
      totalAmount: 11800.00,
      isMathValid: true,
      confidenceScore: 0.96,
      reviewedById: adminUser.id,
      reviewedAt: new Date('2026-08-16T10:30:00Z'),
      reviewNotes: 'Verified against supplier GSTIN on portal.',
      lineItems: {
        create: [
          {
            description: 'A4 Copier Paper Reams (Pack of 10)',
            hsnCode: '4802',
            quantity: 50,
            unit: 'BOX',
            unitPrice: 200.00,
            taxableAmount: 10000.00,
            gstRate: 18.00,
            cgstAmount: 900.00,
            sgstAmount: 900.00,
            totalAmount: 11800.00,
          },
        ],
      },
    },
  });

  // Invoice 2: Needs Review (Inter-state invoice from Gurgaon, Haryana)
  const invoice2 = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: client2.id,
      senderPhone: '919877665544',
      whatsappMessageId: 'wamid.HBgMOTE5ODc3NjY1NTQ0FQIAEhggOTg3NjU0MzIxMAA=',
      fileUrl: '/uploads/sample_inv_02.jpg',
      fileMimeType: 'image/jpeg',
      fileSizeBytes: 680210,
      status: InvoiceStatus.NEEDS_REVIEW,
      invoiceType: InvoiceType.B2B_TAX_INVOICE,
      invoiceNumber: 'DEL-HGN-4412',
      invoiceDate: new Date('2026-08-20'),
      supplierName: 'Cybertronics Hardware Gurgaon',
      supplierGstin: '06EEEFF5555E1Z9',
      supplierPan: 'EEEFF5555E',
      supplierAddress: 'Udyog Vihar Phase IV, Gurgaon, Haryana 122015',
      buyerGstin: client2.gstin,
      taxableAmount: 25000.00,
      cgstAmount: 0.00,
      sgstAmount: 0.00,
      igstAmount: 4500.00,
      cessAmount: 0.00,
      roundOffAmount: 0.00,
      totalAmount: 29500.00,
      isMathValid: true,
      confidenceScore: 0.91,
      lineItems: {
        create: [
          {
            description: 'Industrial Heavy Duty Inverter 5kVA',
            hsnCode: '8504',
            quantity: 1,
            unit: 'PCS',
            unitPrice: 25000.00,
            taxableAmount: 25000.00,
            gstRate: 18.00,
            igstAmount: 4500.00,
            totalAmount: 29500.00,
          },
        ],
      },
    },
  });

  // Invoice 3: Unmapped WhatsApp Bill (New sender)
  const invoice3 = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: null,
      senderPhone: '919891002233',
      whatsappMessageId: 'wamid.HBgMOTE5ODkxMDAyMjMzFQIAEhggNTU0NDMzMjIxMQA=',
      fileUrl: '/uploads/sample_inv_03.jpg',
      fileMimeType: 'image/jpeg',
      fileSizeBytes: 312450,
      status: InvoiceStatus.NEEDS_REVIEW,
      invoiceType: InvoiceType.EXPENSE_VOUCHER,
      invoiceNumber: 'RCPT-8821',
      invoiceDate: new Date('2026-08-21'),
      supplierName: 'Haldiram Snacks Connaught Place',
      supplierGstin: '07AAACH1234A1Z0',
      supplierPan: 'AAACH1234A',
      taxableAmount: 1500.00,
      cgstAmount: 37.50,
      sgstAmount: 37.50,
      totalAmount: 1575.00,
      isMathValid: true,
      confidenceScore: 0.88,
    },
  });

  console.log(`Created 3 Sample Invoices: [${invoice1.id}, ${invoice2.id}, ${invoice3.id}]`);
  console.log('✅ Database Seed Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
