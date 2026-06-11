import React, { useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { formatCurrency } from '../utils/billCalculations';

const statusLabels = {
  pending: 'Pending',
  uploaded: 'Uploaded - Waiting Verification',
  verified: 'Verified',
  rejected: 'Rejected'
};

export default function PaymentTracker({ bill, paymentProofs = [], isAdmin = false, adminToken, onProofUpdated }) {
  const [busyPersonId, setBusyPersonId] = useState(null);
  const [error, setError] = useState('');

  const metrics = useMemo(() => {
    const totalExpected = paymentProofs.reduce((sum, proof) => sum + (Number(proof.expected_amount) || 0), 0);
    const totalUploaded = paymentProofs
      .filter((proof) => ['uploaded', 'verified'].includes(proof.status))
      .reduce((sum, proof) => sum + (Number(proof.paid_amount ?? proof.expected_amount) || 0), 0);
    const totalVerified = paymentProofs
      .filter((proof) => proof.status === 'verified')
      .reduce((sum, proof) => sum + (Number(proof.paid_amount ?? proof.expected_amount) || 0), 0);
    const verifiedCount = paymentProofs.filter((proof) => proof.status === 'verified').length;
    const progress = totalExpected > 0 ? Math.min(100, (totalVerified / totalExpected) * 100) : 0;

    return {
      totalExpected,
      totalUploaded,
      totalVerified,
      remaining: Math.max(0, totalExpected - totalVerified),
      verifiedCount,
      progress
    };
  }, [paymentProofs]);

  const viewProof = async (objectKey) => {
    try {
      setError('');
      const data = await apiRequest(`/api/payment-proofs/view-url?objectKey=${encodeURIComponent(objectKey)}`, {
        method: 'GET',
        headers: {}
      });
      window.open(data.viewUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError('Failed to open proof preview. Please try again.');
    }
  };

  const updateStatus = async (personId, action) => {
    try {
      setError('');
      setBusyPersonId(personId);
      const data = await apiRequest(`/api/bills/${bill.id}/admin/${adminToken}/payment-proofs/${personId}/${action}`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      onProofUpdated?.(data.paymentProof);
    } catch (err) {
      setError(action === 'verify' ? 'Failed to verify proof.' : 'Failed to reject proof.');
    } finally {
      setBusyPersonId(null);
    }
  };

  return (
    <section className="flow-card payment-tracker-shell">
      <div className="flow-header summary-head">
        <div>
          <div className="section-label-bar">Settlement tracker</div>
          <h2>Payment progress</h2>
        </div>
        <strong className="summary-total">{metrics.verifiedCount}/{paymentProofs.length}</strong>
      </div>

      <div className="payment-metrics-grid">
        <div><span>Total expected</span><strong>{formatCurrency(metrics.totalExpected)}</strong></div>
        <div><span>Total uploaded</span><strong>{formatCurrency(metrics.totalUploaded)}</strong></div>
        <div><span>Total verified</span><strong>{formatCurrency(metrics.totalVerified)}</strong></div>
        <div><span>Remaining</span><strong>{formatCurrency(metrics.remaining)}</strong></div>
      </div>

      <div className="progress-track" aria-label="Verified payment progress">
        <span style={{ width: `${metrics.progress}%` }} />
      </div>

      {error && <div className="inline-error">{error}</div>}

      <div className="proof-list">
        {paymentProofs.map((proof) => (
          <article key={proof.person_id} className="proof-card">
            <div>
              <h3>{proof.person_name}</h3>
              <p>Expected {formatCurrency(proof.expected_amount)}</p>
              {proof.paid_amount !== null && proof.paid_amount !== undefined && <p>Paid {formatCurrency(proof.paid_amount)}</p>}
              {proof.note && <p className="muted-copy">Note: {proof.note}</p>}
            </div>
            <div className="proof-actions">
              <span className={`status-badge status-${proof.status}`}>{statusLabels[proof.status] || proof.status}</span>
              {proof.proof_object_key && (
                <button type="button" className="btn-secondary" onClick={() => viewProof(proof.proof_object_key)}>
                  <ExternalLink size={15} /> View proof
                </button>
              )}
              {isAdmin && proof.proof_object_key && proof.status !== 'verified' && (
                <button type="button" className="btn-submit" disabled={busyPersonId === proof.person_id} onClick={() => updateStatus(proof.person_id, 'verify')}>
                  <CheckCircle2 size={15} /> Verify
                </button>
              )}
              {isAdmin && proof.status !== 'rejected' && proof.status !== 'verified' && (
                <button type="button" className="btn-secondary" disabled={busyPersonId === proof.person_id} onClick={() => updateStatus(proof.person_id, 'reject')}>
                  <XCircle size={15} /> Reject
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
