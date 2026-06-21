import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSupabaseClient } from './supabaseClient.mjs';
import { createMinioClient, ensureProofBucket, minioBucket } from './minioClient.mjs';
import { calculateBillTotals } from './billCalculator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const app = express();
const port = Number(process.env.PORT || 3000);
const appBaseUrl = (process.env.APP_BASE_URL || `http://localhost:${port}`).replace(/\/$/, '');
const normalizeBasePath = (value = '/') => {
  const rawValue = String(value || '/').trim();
  if (!rawValue || rawValue === '/') return '';
  return `/${rawValue.replace(/^\/+|\/+$/g, '')}`;
};
const appBasePath = normalizeBasePath(process.env.APP_BASE_PATH || process.env.VITE_APP_BASE_PATH || '');
const allowedProofTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const maxProofSize = 5 * 1024 * 1024;

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '12mb' }));

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const supabase = createSupabaseClient();
const minioClient = createMinioClient();
await ensureProofBucket(minioClient);

const sendError = (res, status, message) => res.status(status).json({ error: message });
const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));

const safeFileName = (fileName = 'proof') => {
  const cleanName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').slice(0, 120);
  return cleanName || 'proof';
};

const publicBillUrl = (billId) => `${appBaseUrl}/bill/${billId}`;
const adminBillUrl = (billId, adminToken) => `${appBaseUrl}/bill/${billId}/admin/${adminToken}`;

const fetchBill = async (billId) => {
  const { data, error } = await supabase.from('bills').select('*').eq('id', billId).single();
  if (error) return { error };
  return { data };
};

const fetchPaymentProofs = async (billId) => {
  const { data, error } = await supabase
    .from('payment_proofs')
    .select('*')
    .eq('bill_id', billId)
    .order('created_at', { ascending: true });
  if (error) return { error };
  return { data };
};

const validateAdmin = async (billId, adminToken) => {
  const { data: bill, error } = await supabase
    .from('bills')
    .select('*')
    .eq('id', billId)
    .eq('admin_token', adminToken)
    .single();

  if (error || !bill) {
    return { error: new Error('Invalid admin link.') };
  }

  return { bill };
};

app.post('/api/receipt-ocr', asyncHandler(async (req, res) => {
  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (!openAiApiKey) {
    return sendError(res, 500, 'OPENAI_API_KEY is not configured on the server.');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req.body)
  });

  const text = await response.text();
  res.status(response.status).type(response.headers.get('content-type') || 'application/json').send(text);
}));

app.post('/api/bills', asyncHandler(async (req, res) => {
  const {
    title = 'Split bill',
    receiptImageUrl = null,
    items = [],
    people = [],
    assignments = {},
    taxRate = 0,
    serviceRate = 0,
    discountAmount = 0
  } = req.body || {};

  if (!Array.isArray(items) || !items.length) {
    return sendError(res, 400, 'At least one bill item is required.');
  }
  if (!Array.isArray(people) || !people.length) {
    return sendError(res, 400, 'At least one person is required.');
  }

  const totals = calculateBillTotals({ items, people, assignments, taxRate, serviceRate, discountAmount });
  const adminToken = crypto.randomBytes(24).toString('base64url');

  const billPayload = {
    admin_token: adminToken,
    title,
    receipt_image_url: receiptImageUrl,
    items_json: items,
    people_json: people,
    assignments_json: assignments,
    tax_rate: Number(taxRate) || 0,
    service_rate: Number(serviceRate) || 0,
    discount_amount: Number(discountAmount) || 0,
    assigned_subtotal: roundMoney(totals.assignedSubtotal),
    total_discount_amount: roundMoney(totals.totalDiscountAmt),
    total_service_amount: roundMoney(totals.totalServiceAmt),
    total_tax_amount: roundMoney(totals.totalTaxAmt),
    grand_total: roundMoney(totals.grandTotal)
  };

  const { data: bill, error: billError } = await supabase.from('bills').insert(billPayload).select('*').single();
  if (billError) {
    return sendError(res, 500, `Failed to save bill: ${billError.message}`);
  }

  const proofRows = totals.peopleTotals.map((person) => ({
    bill_id: bill.id,
    person_id: person.id,
    person_name: person.name,
    expected_amount: roundMoney(person.total),
    status: 'pending'
  }));

  const { data: paymentProofs, error: proofError } = await supabase
    .from('payment_proofs')
    .insert(proofRows)
    .select('*')
    .order('created_at', { ascending: true });

  if (proofError) {
    await supabase.from('bills').delete().eq('id', bill.id);
    return sendError(res, 500, `Failed to create payment tracking rows: ${proofError.message}`);
  }

  return res.status(201).json({
    bill,
    paymentProofs,
    publicUrl: publicBillUrl(bill.id),
    adminUrl: adminBillUrl(bill.id, bill.admin_token)
  });
}));

app.get('/api/bills/:billId', asyncHandler(async (req, res) => {
  const { billId } = req.params;
  const { data: bill, error: billError } = await fetchBill(billId);
  if (billError || !bill) {
    return sendError(res, 404, 'Bill not found.');
  }

  const { data: paymentProofs, error: proofError } = await fetchPaymentProofs(billId);
  if (proofError) {
    return sendError(res, 500, `Failed to load payment proofs: ${proofError.message}`);
  }

  const { admin_token: _adminToken, ...publicBill } = bill;
  return res.json({ bill: publicBill, paymentProofs, isAdmin: false, publicUrl: publicBillUrl(bill.id) });
}));

app.get('/api/bills/:billId/admin/:adminToken', asyncHandler(async (req, res) => {
  const { billId, adminToken } = req.params;
  const { bill, error } = await validateAdmin(billId, adminToken);
  if (error) {
    return sendError(res, 403, 'Invalid admin link.');
  }

  const { data: paymentProofs, error: proofError } = await fetchPaymentProofs(billId);
  if (proofError) {
    return sendError(res, 500, `Failed to load payment proofs: ${proofError.message}`);
  }

  return res.json({
    bill,
    paymentProofs,
    isAdmin: true,
    publicUrl: publicBillUrl(bill.id),
    adminUrl: adminBillUrl(bill.id, bill.admin_token)
  });
}));

app.post('/api/bills/:billId/payment-proofs/:personId/upload-url', asyncHandler(async (req, res) => {
  const { billId, personId } = req.params;
  const { fileName, contentType, fileSize } = req.body || {};

  if (!allowedProofTypes.has(contentType)) {
    return sendError(res, 400, 'Unsupported file type. Use JPG, PNG, WEBP, or PDF.');
  }
  if (Number(fileSize) > maxProofSize) {
    return sendError(res, 400, 'File too large. Maximum file size is 5 MB.');
  }

  const { data: proof, error: proofError } = await supabase
    .from('payment_proofs')
    .select('*')
    .eq('bill_id', billId)
    .eq('person_id', personId)
    .single();

  if (proofError || !proof) {
    return sendError(res, 404, 'Person is not part of this bill.');
  }

  const objectKey = `payment-proofs/${billId}/${personId}/${Date.now()}-${safeFileName(fileName)}`;
  const uploadUrl = await minioClient.presignedPutObject(minioBucket, objectKey, 10 * 60);

  return res.json({ uploadUrl, objectKey });
}));

app.post('/api/bills/:billId/payment-proofs/:personId/complete', asyncHandler(async (req, res) => {
  const { billId, personId } = req.params;
  const { objectKey, fileName, contentType, paidAmount, note = null } = req.body || {};

  if (!objectKey || !objectKey.startsWith(`payment-proofs/${billId}/${personId}/`)) {
    return sendError(res, 400, 'Invalid proof object key.');
  }
  if (!allowedProofTypes.has(contentType)) {
    return sendError(res, 400, 'Unsupported file type. Use JPG, PNG, WEBP, or PDF.');
  }

  const { data, error } = await supabase
    .from('payment_proofs')
    .update({
      proof_object_key: objectKey,
      proof_file_name: fileName,
      proof_content_type: contentType,
      paid_amount: paidAmount === '' || paidAmount === null || paidAmount === undefined ? null : Number(paidAmount),
      note,
      status: 'uploaded',
      uploaded_at: new Date().toISOString(),
      verified_at: null,
      rejected_at: null
    })
    .eq('bill_id', billId)
    .eq('person_id', personId)
    .select('*')
    .single();

  if (error || !data) {
    return sendError(res, 500, `Failed to complete upload: ${error?.message || 'Unknown error'}`);
  }

  return res.json({ paymentProof: data });
}));

app.post('/api/bills/:billId/admin/:adminToken/payment-proofs/:personId/verify', asyncHandler(async (req, res) => {
  const { billId, adminToken, personId } = req.params;
  const { error: adminError } = await validateAdmin(billId, adminToken);
  if (adminError) {
    return sendError(res, 403, 'Invalid admin link.');
  }

  const { data, error } = await supabase
    .from('payment_proofs')
    .update({ status: 'verified', verified_at: new Date().toISOString(), rejected_at: null })
    .eq('bill_id', billId)
    .eq('person_id', personId)
    .select('*')
    .single();

  if (error || !data) {
    return sendError(res, 500, `Failed to verify proof: ${error?.message || 'Unknown error'}`);
  }

  return res.json({ paymentProof: data });
}));

app.post('/api/bills/:billId/admin/:adminToken/payment-proofs/:personId/reject', asyncHandler(async (req, res) => {
  const { billId, adminToken, personId } = req.params;
  const { note } = req.body || {};
  const { error: adminError } = await validateAdmin(billId, adminToken);
  if (adminError) {
    return sendError(res, 403, 'Invalid admin link.');
  }

  const payload = { status: 'rejected', rejected_at: new Date().toISOString(), verified_at: null };
  if (note !== undefined) payload.note = note;

  const { data, error } = await supabase
    .from('payment_proofs')
    .update(payload)
    .eq('bill_id', billId)
    .eq('person_id', personId)
    .select('*')
    .single();

  if (error || !data) {
    return sendError(res, 500, `Failed to reject proof: ${error?.message || 'Unknown error'}`);
  }

  return res.json({ paymentProof: data });
}));

app.get('/api/payment-proofs/view-url', asyncHandler(async (req, res) => {
  const objectKey = String(req.query.objectKey || '');
  if (!objectKey.startsWith('payment-proofs/')) {
    return sendError(res, 400, 'Invalid proof object key.');
  }

  const viewUrl = await minioClient.presignedGetObject(minioBucket, objectKey, 5 * 60);
  return res.json({ viewUrl });
}));

app.use(express.static(distDir));
if (appBasePath) {
  app.use(appBasePath, express.static(distDir));
  app.get([appBasePath, `${appBasePath}/*`], (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  return sendError(res, 500, err.message || 'Unexpected server error.');
});

app.listen(port, () => {
  console.log(`Split Bill API listening on http://localhost:${port}`);
});
