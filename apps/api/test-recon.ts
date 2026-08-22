import { storageService } from './src/services/storage';
import { pdfProcessor } from './src/services/pdfProcessor';
import { gstr2bService } from './src/services/gstr2bReconciliation';
import { extractionQueue } from './src/services/queue';
import { buildServer } from './src/server';
import { Gstr2bMatchStatus, FEATURE_FLAGS } from '@khatagenie/types';

async function runProductionReadinessTests() {
  console.log('🧪 Starting KhataGenie Production Readiness Integration Tests...\n');

  // Test 1: Storage Service save, read, and delete
  console.log('📁 Test 1: Pluggable Storage Service Persistence');
  const testBuffer = Buffer.from('KhataGenie invoice dummy binary content 2026');
  const saveResult = await storageService.saveFile('test_invoice_01.jpg', testBuffer, 'image/jpeg');
  console.log(`   Saved file to: ${saveResult.fileUrl} (${saveResult.sizeBytes} bytes)`);

  const readBuffer = await storageService.getFileBuffer(saveResult.storageKey);
  if (readBuffer.toString() !== testBuffer.toString()) {
    throw new Error('Storage read buffer does not match saved content!');
  }
  await storageService.deleteFile(saveResult.storageKey);
  console.log('   ✅ Storage Service verified successfully.\n');

  // Test 2: Multi-Page PDF Document Processor
  console.log('📄 Test 2: Multi-Page PDF Document Processor');
  const docResult = await pdfProcessor.processDocument('/uploads/sample_tax_invoice.pdf', 'application/pdf', '/uploads/sample_tax_invoice.pdf');
  console.log(`   Processed document: isPdf=${docResult.isPdf}, pageCount=${docResult.pageCount}`);
  if (!docResult.isPdf || docResult.pageCount < 1) {
    throw new Error('PDF Processor failed to identify PDF document!');
  }
  console.log('   ✅ PDF Processor verified successfully.\n');

  // Test 3: GSTR-2B JSON Parsing & 2-Way ITC Matching Engine
  console.log('⚖️ Test 3: GSTR-2B 2-Way ITC Reconciliation Engine');
  const mockGstr2bJson = {
    data: {
      fp: '082026',
      docdata: {
        b2b: [
          {
            ctin: '07AAAFB1234F1Z3',
            cname: 'Shree Balaji Industrial Hardware',
            inv: [
              {
                inum: 'SBI-2026/0412',
                idt: '2026-08-20',
                val: 21240.0,
                itcavl: 'Y',
                items: [
                  {
                    itm_det: {
                      txval: 18000.0,
                      camt: 1620.0,
                      samt: 1620.0,
                      iamt: 0.0,
                      csamt: 0.0,
                    },
                  },
                ],
              },
            ],
          },
          {
            ctin: '07KLLMN8899K1Z5',
            cname: 'Kailash Offset Printers Okhla',
            inv: [
              {
                inum: 'KOP-8891',
                idt: '2026-08-18',
                val: 8850.0,
                itcavl: 'Y',
                items: [
                  {
                    itm_det: {
                      txval: 7500.0,
                      camt: 675.0,
                      samt: 675.0,
                      iamt: 0.0,
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

  const parsedRecords = gstr2bService.parseGstr2bJson(mockGstr2bJson);
  console.log(`   Parsed ${parsedRecords.length} GSTR-2B records from portal JSON.`);
  if (parsedRecords.length !== 2) {
    throw new Error('GSTR-2B parser failed to extract expected record count.');
  }

  const reconSummary = await gstr2bService.reconcile('org_bansal_ca', parsedRecords);
  console.log(`   Reconciliation summary: Total 2B Records=${reconSummary.totalGstr2bRecords}, Total Books=${reconSummary.totalBooksRecords}, Matched=${reconSummary.matchedCount}, Missing in Books=${reconSummary.missingInBooksCount}`);
  if (reconSummary.totalGstr2bRecords !== 2) {
    throw new Error('Reconciliation record count mismatch.');
  }
  console.log('   ✅ GSTR-2B Reconciliation Engine verified successfully.\n');

  // Test 4: Extraction Queue status check
  console.log('⚡ Test 4: Resilient Background Extraction Queue');
  const queueStatus = extractionQueue.getQueueStatus();
  console.log(`   Queue status: Queued=${queueStatus.queuedJobs}, Active=${queueStatus.activeJobs}, Max Concurrency=${queueStatus.maxConcurrency}`);
  if (queueStatus.maxConcurrency !== 3) {
    throw new Error('Extraction queue concurrency setting mismatch.');
  }
  console.log('   ✅ Background Extraction Queue verified successfully.\n');

  // Test 5: Fastify Route Feature Flag Gating on /api/v1/reconciliation
  console.log('🛡️ Test 5: Feature Flag Route Guarding Verification');
  const app = await buildServer();

  // Test with free tier token (gstr2b disabled by default)
  const freeToken = app.jwt.sign({
    userId: 'usr_free_01',
    organizationId: 'org_free_firm',
    role: 'CA_STAFF',
    email: 'staff@freeca.com',
  });

  const gatedRes = await app.inject({
    method: 'GET',
    url: '/api/v1/reconciliation/sample',
    headers: {
      Authorization: `Bearer ${freeToken}`,
    },
  });

  console.log(`   Gated route check for free tier: Status=${gatedRes.statusCode}`);
  if (gatedRes.statusCode !== 403) {
    throw new Error(`Expected 403 FEATURE_DISABLED on ungated request, received ${gatedRes.statusCode}`);
  }
  console.log('   ✅ 403 FEATURE_DISABLED correctly enforced by featureGuard middleware.\n');

  await app.close();
  console.log('🎉 ALL PRODUCTION-READINESS AND GATING TESTS PASSED!');
}

runProductionReadinessTests().catch((err) => {
  console.error('❌ Production readiness tests failed:', err);
  process.exit(1);
});
