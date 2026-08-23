import { buildServer } from './src/server';

async function runCrudVerification() {
  console.log('🧪 Starting Full CRUD Endpoint Verification Suite...\n');

  const app = await buildServer();

  // 1. AUTH LOGIN
  console.log('--- 1. Testing Authentication ---');
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: 'admin@khatagenie.com',
      password: 'KhataGenie#2026',
    },
  });
  console.log(`[AUTH] POST /api/v1/auth/login -> Status: ${loginRes.statusCode}`);
  if (loginRes.statusCode !== 200) {
    throw new Error(`Login failed: ${loginRes.body}`);
  }
  const loginData = JSON.parse(loginRes.body);
  const token = loginData.token;
  const authHeaders = { authorization: `Bearer ${token}` };
  console.log(`[AUTH] JWT Token issued for: ${loginData.user.fullName} (${loginData.user.role})\n`);

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

  // 2d. DELETE /api/v1/clients/:id (DELETE)
  const deleteClientRes = await app.inject({
    method: 'DELETE',
    url: `/api/v1/clients/${createdClient.id}`,
    headers: authHeaders,
  });
  console.log(`[CLIENTS - DELETE] DELETE /api/v1/clients/${createdClient.id} -> Status: ${deleteClientRes.statusCode}\n`);
  if (deleteClientRes.statusCode !== 200) throw new Error('Delete client failed');

  // 3. INVOICES CRUD
  console.log('--- 3. Testing Invoices CRUD ---');

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
  const firstInvoiceId = invoicesData.invoices[0]?.id || 'inv-delhi-01';
  const getInvoiceRes = await app.inject({
    method: 'GET',
    url: `/api/v1/invoices/${firstInvoiceId}`,
    headers: authHeaders,
  });
  console.log(`[INVOICES - READ SINGLE] GET /api/v1/invoices/${firstInvoiceId} -> Status: ${getInvoiceRes.statusCode}`);
  if (getInvoiceRes.statusCode !== 200) throw new Error('Failed to get single invoice');

  // 3c. PATCH /api/v1/invoices/:id (UPDATE / APPROVE)
  const approveInvoiceRes = await app.inject({
    method: 'PATCH',
    url: `/api/v1/invoices/${firstInvoiceId}`,
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
  console.log(`[INVOICES - APPROVE] PATCH /api/v1/invoices/${firstInvoiceId} -> Status: ${approveInvoiceRes.statusCode}`);
  if (approveInvoiceRes.statusCode !== 200) throw new Error('Failed to approve invoice');
  const approvedData = JSON.parse(approveInvoiceRes.body);
  console.log(`[INVOICES - APPROVE] Invoice status is now: ${approvedData.status}\n`);

  // 4. GSTR-2B RECONCILIATION
  console.log('--- 4. Testing GSTR-2B 2-Way Reconciliation ---');
  const sampleReconRes = await app.inject({
    method: 'GET',
    url: '/api/v1/reconciliation/sample',
    headers: authHeaders,
  });
  console.log(`[RECON - SAMPLE] GET /api/v1/reconciliation/sample -> Status: ${sampleReconRes.statusCode}`);
  const sampleGstr2b = JSON.parse(sampleReconRes.body);

  const processReconRes = await app.inject({
    method: 'POST',
    url: '/api/v1/reconciliation/process',
    headers: authHeaders,
    payload: sampleGstr2b,
  });
  console.log(`[RECON - PROCESS] POST /api/v1/reconciliation/process -> Status: ${processReconRes.statusCode}`);
  if (processReconRes.statusCode !== 200) throw new Error('Reconciliation process failed');
  const reconSummary = JSON.parse(processReconRes.body);
  console.log(`[RECON - RESULT] Matched: ${reconSummary.matchedCount}, Missing: ${reconSummary.missingInGstr2bCount}\n`);

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
  console.log(`[EXPORTS - EXCEL] GET /api/v1/exports/excel -> Status: ${excelExportRes.statusCode}, Content-Type: ${excelExportRes.headers['content-type']}`);
  if (excelExportRes.statusCode !== 200) throw new Error('Excel export failed');

  console.log('\n🎉 ALL CRUD & EXPORT ENDPOINTS FULLY VERIFIED AND PASSING (100%)!');
}

runCrudVerification().catch((err) => {
  console.error('❌ CRUD Verification Failed:', err);
  process.exit(1);
});
