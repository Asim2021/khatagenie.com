import { buildServer } from './src/server';
import { tallyExporter } from './src/services/tallyExporter';
import { excelExporter } from './src/services/excelExporter';

async function testFastifyApi() {
  console.log('🚀 Starting KhataGenie Fastify API Integration Tests...');

  const app = await buildServer();

  // Test 1: Health Check Endpoint
  const healthRes = await app.inject({
    method: 'GET',
    url: '/health',
  });
  console.log(`[Test 1] GET /health: Status=${healthRes.statusCode}, Body=${healthRes.body}`);
  if (healthRes.statusCode !== 200) {
    throw new Error('Health check failed');
  }

  // Test 2: WhatsApp Webhook Challenge Verification
  const verifyToken = 'khatagenie_verify_token_2026';
  const challengeCode = '1158201234';
  const webhookVerifyRes = await app.inject({
    method: 'GET',
    url: `/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=${challengeCode}`,
  });
  console.log(`[Test 2] WhatsApp Webhook Verify: Status=${webhookVerifyRes.statusCode}, Challenge=${webhookVerifyRes.body}`);
  if (webhookVerifyRes.statusCode !== 200 || webhookVerifyRes.body !== challengeCode) {
    throw new Error('WhatsApp webhook verification failed');
  }

  // Test 3: WhatsApp Webhook Event Ingestion (Immediate 200 OK acknowledgment)
  const webhookPostRes = await app.inject({
    method: 'POST',
    url: '/api/v1/whatsapp/webhook',
    payload: {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '919811000000', phone_number_id: '123456789' },
                messages: [
                  {
                    from: '919811223344',
                    id: 'wamid.HBgMOTE5ODExMjIzMzQ0FQIAEhggMTIzNDU2Nzg5MAA=',
                    timestamp: '1724281200',
                    type: 'text',
                    text: { body: 'Hello KhataGenie, I am sending a bill.' },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    },
  });
  console.log(`[Test 3] WhatsApp Incoming Event: Status=${webhookPostRes.statusCode}, Body=${webhookPostRes.body}`);
  if (webhookPostRes.statusCode !== 200) {
    throw new Error('WhatsApp event receiver failed');
  }

  // Test 4: Tally Prime XML Export generation test
  const sampleInvoices = [
    {
      id: 'inv-test-1',
      invoiceNumber: 'INV-2026-901',
      invoiceDate: new Date('2026-08-22'),
      supplierName: 'Om Prakash Paper Mart',
      taxableAmount: 5000.0,
      cgstAmount: 450.0,
      sgstAmount: 450.0,
      igstAmount: 0,
      totalAmount: 5900.0,
      senderPhone: '919811223344',
      client: { tallyLedgerName: 'Aggarwal Traders - Purchase A/c' },
    },
    {
      id: 'inv-test-2',
      invoiceNumber: 'DEL-HR-002',
      invoiceDate: new Date('2026-08-22'),
      supplierName: 'Cyber Electronics Haryana',
      taxableAmount: 10000.0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 1800.0,
      totalAmount: 11800.0,
      senderPhone: '919877665544',
      client: { tallyLedgerName: 'Sharma Electronics - Purchase A/c' },
    },
  ];

  const xmlOutput = tallyExporter.generatePurchaseVouchersXml(sampleInvoices, 'Bansal & Associates CA');
  console.log('[Test 4] Tally XML Output generated successfully (Length: ' + xmlOutput.length + ' chars)');
  if (!xmlOutput.includes('<VOUCHER VCHTYPE="Purchase"') || !xmlOutput.includes('<LEDGERNAME>Input CGST</LEDGERNAME>')) {
    throw new Error('Tally XML generation format mismatch');
  }

  // Test 5: Excel GSTR-2 Export generation test
  const excelBuffer = excelExporter.generatePurchaseRegisterExcel(sampleInvoices);
  console.log('[Test 5] Excel GSTR-2 Buffer generated successfully (Size: ' + excelBuffer.length + ' bytes)');
  if (!excelBuffer || excelBuffer.length < 1000) {
    throw new Error('Excel generation failed');
  }

  // Test 6: Security - Seed Admin Authentication Hardening Check
  const invalidLoginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: 'admin@khatagenie.com',
      password: 'wrong_password_123',
    },
  });
  console.log(`[Test 6] Security: Invalid password rejected with status=${invalidLoginRes.statusCode}`);
  if (invalidLoginRes.statusCode !== 401) {
    throw new Error('Security check failed: Invalid password was not rejected!');
  }

  const validLoginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: 'admin@khatagenie.com',
      password: 'KhataGenie#2026',
    },
  });
  console.log(`[Test 7] Security: Valid password accepted with status=${validLoginRes.statusCode}`);
  if (validLoginRes.statusCode !== 200) {
    throw new Error('Valid login failed!');
  }

  console.log('✅ ALL FASTIFY API, EXPORTER, AND SECURITY TESTS PASSED!');
  await app.close();
}

testFastifyApi().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
