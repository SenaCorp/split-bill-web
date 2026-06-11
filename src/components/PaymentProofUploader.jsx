import React, { useMemo, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { calculateBillTotals, formatCurrency } from '../utils/billCalculations';

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const maxSize = 5 * 1024 * 1024;

export default function PaymentProofUploader({ bill, paymentProof, onProofUpdated }) {
  const [file, setFile] = useState(null);
  const [paidAmount, setPaidAmount] = useState(paymentProof?.paid_amount ?? paymentProof?.expected_amount ?? 0);
  const [note, setNote] = useState(paymentProof?.note || '');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const personBreakdown = useMemo(() => {
    const totals = calculateBillTotals({
      items: bill.items_json || [],
      people: bill.people_json || [],
      assignments: bill.assignments_json || {},
      taxRate: bill.tax_rate,
      serviceRate: bill.service_rate,
      discountAmount: bill.discount_amount
    });
    return totals.peopleTotals.find((person) => person.id === paymentProof?.person_id);
  }, [bill, paymentProof]);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    setError('');
    if (!selected) return;
    if (!allowedTypes.includes(selected.type)) {
      setFile(null);
      setError('Unsupported file type. Please upload JPG, PNG, WEBP, or PDF.');
      return;
    }
    if (selected.size > maxSize) {
      setFile(null);
      setError('File too large. Maximum file size is 5 MB.');
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Please choose a payment proof file first.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setStatus('Generating secure upload URL...');

      const uploadData = await apiRequest(`/api/bills/${bill.id}/payment-proofs/${paymentProof.person_id}/upload-url`, {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, contentType: file.type, fileSize: file.size })
      });

      setStatus('Uploading proof to private storage...');
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      setStatus('Saving upload status...');
      const completeData = await apiRequest(`/api/bills/${bill.id}/payment-proofs/${paymentProof.person_id}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          objectKey: uploadData.objectKey,
          fileName: file.name,
          contentType: file.type,
          paidAmount,
          note
        })
      });

      onProofUpdated?.(completeData.paymentProof);
      setStatus('Payment proof uploaded. Waiting for host verification.');
    } catch (err) {
      setError(err.message === 'Upload failed' ? 'Upload failed. Please try again.' : err.message || 'Failed to upload proof.');
      setStatus('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flow-card proof-upload-shell">
      <div className="flow-header summary-head">
        <div>
          <div className="section-label-bar">Participant payment</div>
          <h2>{paymentProof?.person_name}</h2>
        </div>
        <strong className="summary-total">{formatCurrency(paymentProof?.expected_amount)}</strong>
      </div>

      <div className="status-line">
        Current status: <span className={`status-badge status-${paymentProof?.status}`}>{paymentProof?.status || 'pending'}</span>
      </div>

      {personBreakdown?.items?.length > 0 && (
        <div className="summary-lines proof-breakdown">
          {personBreakdown.items.map((item, index) => (
            <div key={`${item.name}-${index}`} className="summary-line">
              <span>{item.name} (x{item.quantity})</span>
              <strong>{formatCurrency(item.share)}</strong>
            </div>
          ))}
        </div>
      )}

      <form className="proof-upload-form" onSubmit={handleSubmit}>
        <label>
          Proof file (JPG, PNG, WEBP, PDF, max 5 MB)
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileChange} />
        </label>
        <label>
          Paid amount
          <input type="number" min="0" step="0.01" value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} />
        </label>
        <label>
          Note
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional transfer note" />
        </label>

        {error && <div className="inline-error">{error}</div>}
        {status && <div className="success-note">{status}</div>}

        <button className="btn-submit" type="submit" disabled={isSubmitting}>
          <UploadCloud size={17} /> {isSubmitting ? 'Uploading...' : 'Submit payment proof'}
        </button>
      </form>
    </section>
  );
}
