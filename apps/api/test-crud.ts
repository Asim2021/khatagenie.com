import { buildServer } from './src/server';
import { prisma } from './src/lib/prisma';

async function runCrudVerification() {
  console.log('🧪 Starting Full Database CRUD & Dual-Token Auth Verification Suite...\n');

  const app = await buildServer();

  // 1. AUTH LOGIN & DUAL-TOKEN COOKIE VERIFICATION
  console.log('--- 1. Testing Dual-Token Authentication & httpOnly Cookies ---');
  
  // 1a. Normal Login (1 Day Cookie)
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: 'admin@khatagenie.com',
      password: 'Asim@123',
      rememberMe: false,
    },
  });
  console.log(`[AUTH] POST /api/v1/auth/login (1-day) -> Status: ${loginRes.statusCode}`);
  if (loginRes.statusCode !== 200) {
    throw new Error(`Login failed: ${loginRes.body}`);
  }
  const loginData = JSON.parse(loginRes.body);
  const token = loginData.token;
  const authHeaders = { authorization: `Bearer ${token}` };
  
  const setCookieHeader = loginRes.headers['set-cookie'] as string;
  console.log(`[AUTH] Access Token (15m): ${token.substring(0, 25)}...`);
  console.log(`[AUTH] Set-Cookie Header: ${setCookieHeader}`);
  
  if (!setCookieHeader || !setCookieHeader.includes('refreshToken=') || !setCookieHeader.includes('HttpOnly')) {
    throw new Error('Expected HttpOnly refreshToken cookie was not set in headers');
  }

  // 1b. Remember Me Login (7 Days Cookie)
  const rememberLoginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: 'admin@khatagenie.com',
      password: 'Asim@123',
      rememberMe: true,
    },
  });
  console.log(`[AUTH] POST /api/v1/auth/login (rememberMe=true) -> Status: ${rememberLoginRes.statusCode}`);
  const rememberCookie = rememberLoginRes.headers['set-cookie'] as string;
  console.log(`[AUTH] Remember-Me Cookie Header: ${rememberCookie}`);
  if (!rememberCookie.includes('Max-Age=604800')) {
    throw new Error('Expected 7-day Max-Age (604800s) on rememberMe login cookie');
  }

  // 1c. POST /api/v1/auth/refresh (Rotate Access Token via Cookie)
  const cookieValue = rememberCookie.split(';')[0];
  const refreshRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/refresh',
    headers: {
      cookie: cookieValue,
    },
  });
  console.log(`[AUTH] POST /api/v1/auth/refresh -> Status: ${refreshRes.statusCode}`);
  if (refreshRes.statusCode !== 200) throw new Error(`Refresh token failed: ${refreshRes.body}`);
  const refreshData = JSON.parse(refreshRes.body);
  console.log(`[AUTH] New Access Token Rotated: ${refreshData.token.substring(0, 25)}...`);
  const rotatedCookie = refreshRes.headers['set-cookie'] as string;
  if (!rotatedCookie || !rotatedCookie.includes('refreshToken=')) {
    throw new Error('Expected rotated refreshToken cookie');
  }

  // 1d. POST /api/v1/auth/logout (Clear Cookie)
  const logoutRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/logout',
  });
  console.log(`[AUTH] POST /api/v1/auth/logout -> Status: ${logoutRes.statusCode}`);
  const clearedCookie = logoutRes.headers['set-cookie'] as string;
  console.log(`[AUTH] Cleared Cookie Header: ${clearedCookie}\n`);

  // 2. CLIENTS CRUD
  console.log('--- 2. Testing MSME Clients CRUD ---');
  
  // 2a. GET /api/v1/clients
  const listClientsRes = await app.inject({
    method: 'GET',
    url: '/api/v1/clients',
    headers: authHeaders,
  });
  console.log(`[CLIENTS - READ] GET /api/v1/clients -> Status: ${listClientsRes.statusCode}`);
  const clientsList = JSON.parse(listClientsRes.body);
  console.log(`[CLIENTS - READ] Initial client count: ${clientsList.length}`);
  if (listClientsRes.statusCode !== 200) throw new Error('Failed to list clients');

  // 2b. POST /api/v1/clients (CREATE)
  const createClientRes = await app.inject({
    method: 'POST',
    url: '/api/v1/clients',
    headers: authHeaders,
    payload: {
      businessName: 'Verma Industrial Tools & Spares',
      tradeName: 'Verma Tools',
      gstin: '07AAACV1234V1Z9',
      whatsappPhone: '+91 9811998877',
      tallyLedgerName: 'Verma Tools - Purchase A/c',
    },
  });
  console.log(`[CLIENTS - CREATE] POST /api/v1/clients -> Status: ${createClientRes.statusCode}`);
  if (createClientRes.statusCode !== 201 && createClientRes.statusCode !== 200) {
    throw new Error(`Create client failed: ${createClientRes.body}`);
  }
  const createdClient = JSON.parse(createClientRes.body);
  console.log(`[CLIENTS - CREATE] Created Client ID: ${createdClient.id}, Phone: ${createdClient.whatsappPhone}`);

  // 2c. PATCH /api/v1/clients/:id (UPDATE)
  const patchClientRes = await app.inject({
    method: 'PATCH',
    url: `/api/v1/clients/${createdClient.id}`,
    headers: authHeaders,
    payload: {
      tradeName: 'Verma Tools & Machinery',
      contactPerson: 'Arun Verma',
    },
  });
  console.log(`[CLIENTS - UPDATE] PATCH /api/v1/clients/${createdClient.id} -> Status: ${patchClientRes.statusCode}`);
  if (patchClientRes.statusCode !== 200) throw new Error('Update client failed');
  const updatedClient = JSON.parse(patchClientRes.body);
  console.log(`[CLIENTS - UPDATE] Updated Trade Name: ${updatedClient.tradeName}`);

  // 3. INVOICES CRUD
  console.log('\n--- 3. Testing Invoices CRUD (Seeding Test Invoice) ---');

  // Seed test invoice directly for testing
  const seededInvoice = await prisma.invoice.create({
    data: {
      organizationId: loginData.user.organizationId,
      clientId: createdClient.id,
      senderPhone: '919811998877',
      fileUrl: '/uploads/test_invoice.jpg',
      fileMimeType: 'image/jpeg',
      fileSizeBytes: 102400,
      status: 'NEEDS_REVIEW',
      invoiceNumber: 'DEL-HGN-4412',
      invoiceDate: new Date('2026-08-20'),
      supplierName: 'Cybertronics Hardware Gurgaon',
      supplierGstin: '06EEEFF5555E1Z9',
      taxableAmount: 25000.0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 4500.0,
      totalAmount: 29500.0,
      isMathValid: true,
      confidenceScore: 0.91,
      lineItems: {
        create: [
          {
            description: 'Industrial Power Supply 24V 10A DIN Rail',
            hsnCode: '8504',
            quantity: 5,
            unit: 'PCS',
            unitPrice: 5000.0,
            taxableAmount: 25000.0,
            gstRate: 18.0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 4500.0,
            totalAmount: 29500.0,
          },
        ],
      },
    },
  });
  console.log(`[INVOICES - SEED] Seeded test invoice in DB with ID: ${seededInvoice.id}`);

  // 3a. GET /api/v1/invoices (LIST)
  const listInvoicesRes = await app.inject({
    method: 'GET',
    url: '/api/v1/invoices',
    headers: authHeaders,
  });
  console.log(`[INVOICES - READ] GET /api/v1/invoices -> Status: ${listInvoicesRes.statusCode}`);
  const invoicesData = JSON.parse(listInvoicesRes.body);
  console.log(`[INVOICES - READ] Total invoices found: ${invoicesData.invoices.length}`);
  if (listInvoicesRes.statusCode !== 200) throw new Error('Failed to list invoices');

  // 3b. GET /api/v1/invoices/:id (READ SINGLE)
  const getInvoiceRes = await app.inject({
    method: 'GET',
    url: `/api/v1/invoices/${seededInvoice.id}`,
    headers: authHeaders,
  });
  console.log(`[INVOICES - READ SINGLE] GET /api/v1/invoices/${seededInvoice.id} -> Status: ${getInvoiceRes.statusCode}`);
  if (getInvoiceRes.statusCode !== 200) throw new Error('Failed to get single invoice');

  // 3c. PATCH /api/v1/invoices/:id (UPDATE / APPROVE)
  const approveInvoiceRes = await app.inject({
    method: 'PATCH',
    url: `/api/v1/invoices/${seededInvoice.id}`,
    headers: authHeaders,
    payload: {
      status: 'APPROVED',
      invoiceNumber: 'DEL-HGN-4412',
      taxableAmount: 25000,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 4500,
      totalAmount: 29500,
      reviewNotes: 'Verified with physical invoice copy.',
    },
  });
  console.log(`[INVOICES - APPROVE] PATCH /api/v1/invoices/${seededInvoice.id} -> Status: ${approveInvoiceRes.statusCode}`);
  if (approveInvoiceRes.statusCode !== 200) throw new Error('Failed to approve invoice');
  const approvedData = JSON.parse(approveInvoiceRes.body);
  console.log(`[INVOICES - APPROVE] Invoice status is now: ${approvedData.status}\n`);

  // 4. GSTR-2B RECONCILIATION
  console.log('--- 4. Testing GSTR-2B 2-Way Reconciliation with Upload Payload ---');
  const uploadedGstr2bJson = {
    data: {
      fp: '082026',
      docdata: {
        b2b: [
          {
            ctin: '06EEEFF5555E1Z9',
            cname: 'Cybertronics Hardware Gurgaon',
            inv: [
              {
                inum: 'DEL-HGN-4412',
                idt: '2026-08-20',
                val: 29500.0,
                itcavl: 'Y',
                items: [
                  {
                    itm_det: {
                      txval: 25000.0,
                      camt: 0.0,
                      samt: 0.0,
                      iamt: 4500.0,
                      csamt: 0.0,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  };

  const processReconRes = await app.inject({
    method: 'POST',
    url: '/api/v1/reconciliation/process',
    headers: authHeaders,
    payload: uploadedGstr2bJson,
  });
  console.log(`[RECON - PROCESS] POST /api/v1/reconciliation/process -> Status: ${processReconRes.statusCode}`);
  if (processReconRes.statusCode !== 200) throw new Error('Reconciliation process failed');
  const reconSummary = JSON.parse(processReconRes.body);
  console.log(`[RECON - RESULT] Matched: ${reconSummary.matchedCount}, Missing in 2B: ${reconSummary.missingInGstr2bCount}\n`);

  // 5. EXPORTS
  console.log('--- 5. Testing Tally & Excel Exports ---');
  const tallyExportRes = await app.inject({
    method: 'GET',
    url: '/api/v1/exports/tally',
    headers: authHeaders,
  });
  console.log(`[EXPORTS - TALLY] GET /api/v1/exports/tally -> Status: ${tallyExportRes.statusCode}, Content-Type: ${tallyExportRes.headers['content-type']}`);
  if (tallyExportRes.statusCode !== 200) throw new Error('Tally export failed');

  const excelExportRes = await app.inject({
    method: 'GET',
    url: '/api/v1/exports/excel',
    headers: authHeaders,
  });
  console.log(`[EXPORTS - EXCEL] GET /api/v1/exports/excel -> Status: ${excelExportRes.statusCode}, Content-Type: ${excelExportRes.headers['content-type']}\n`);
  if (excelExportRes.statusCode !== 200) throw new Error('Excel export failed');

  // 6. WHATSAPP STATUS PROBE
  console.log('--- 6. Testing WhatsApp Live Connection Health Probe ---');
  const waStatusRes = await app.inject({
    method: 'GET',
    url: '/api/v1/whatsapp/status',
  });
  console.log(`[WHATSAPP - STATUS] GET /api/v1/whatsapp/status -> Status: ${waStatusRes.statusCode}`);
  if (waStatusRes.statusCode !== 200) throw new Error('WhatsApp status probe failed');
  const waStatusData = JSON.parse(waStatusRes.body);
  console.log(`[WHATSAPP - STATUS] Result: status="${waStatusData.status}", configured=${waStatusData.configured}, message="${waStatusData.message}"`);

  // 7. CLEAN UP TEST DATA
  console.log('\n--- 7. Cleaning Up Test Data ---');
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: seededInvoice.id } });
  await prisma.invoice.delete({ where: { id: seededInvoice.id } });
  await prisma.client.delete({ where: { id: createdClient.id } });
  console.log('🧹 Cleaned up test invoice and test client from database.');

  console.log('\n🎉 ALL DATABASE CRUD, DUAL-TOKEN AUTH & EXPORT ENDPOINTS FULLY VERIFIED AND PASSING (100%)!');
}

runCrudVerification()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error('❌ CRUD Verification Failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
