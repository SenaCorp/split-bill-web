import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import PaymentProofUploader from './PaymentProofUploader';
import PaymentTracker from './PaymentTracker';
import SharePaymentLinks from './SharePaymentLinks';
import { apiRequest } from '../utils/api';
import { calculateBillTotals, formatCurrency } from '../utils/billCalculations';

export default function BillPage({ route, navigate }) {
  const { billId, personId, adminToken, mode } = route;
  const [bill, setBill] = useState(null);
  const [paymentProofs, setPaymentProofs] = useState([]);
  const [links, setLinks] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBill = async () => {
    try {
      setIsLoading(true);
      setError('');
      const path = mode === 'admin'
        ? `/api/bills/${billId}/admin/${adminToken}`
        : `/api/bills/${billId}`;
      const data = await apiRequest(path, { method: 'GET', headers: {} });
      setBill(data.bill);
      setPaymentProofs(data.paymentProofs || []);
      setIsAdmin(Boolean(data.isAdmin));
      setLinks({ publicUrl: data.publicUrl, adminUrl: data.adminUrl });
    } catch (err) {
      setError(err.message || 'Failed to load bill.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBill();
  }, [billId, adminToken, mode]);

  const totals = useMemo(() => {
    if (!bill) return null;
    return calculateBillTotals({
      items: bill.items_json || [],
      people: bill.people_json || [],
      assignments: bill.assignments_json || {},
      taxRate: bill.tax_rate,
      serviceRate: bill.service_rate,
      discountAmount: bill.discount_amount
    });
  }, [bill]);

  const currentProof = paymentProofs.find((proof) => proof.person_id === personId);

  const handleProofUpdated = (updatedProof) => {
    setPaymentProofs((current) => current.map((proof) => (
      proof.person_id === updatedProof.person_id ? updatedProof : proof
    )));
  };

  if (isLoading) {
    return (
      <section className="flow-card state-card">
        <div className="section-label-bar">Loading bill</div>
        <div className="state-body"><p>Fetching payment tracking data...</p></div>
      </section>
    );
  }

  if (error || !bill) {
    return (
      <section className="flow-card state-card error-card">
        <div className="section-label-bar">Bill error</div>
        <div className="state-body">
          <p>{error || 'Bill not found.'}</p>
          <button className="btn-secondary" type="button" onClick={() => navigate('/')}><ArrowLeft size={16} /> Back home</button>
        </div>
      </section>
    );
  }

  if (mode === 'pay') {
    if (!currentProof) {
      return (
        <section className="flow-card state-card error-card">
          <div className="section-label-bar">Participant not found</div>
          <div className="state-body"><p>This payment link is not valid for the bill.</p></div>
        </section>
      );
    }

    return <PaymentProofUploader bill={bill} paymentProof={currentProof} onProofUpdated={handleProofUpdated} />;
  }

  return (
    <div className="remote-bill-stack">
      <section className="flow-card bill-summary-shell">
        <div className="flow-header summary-head">
          <div>
            <div className="section-label-bar">Saved bill</div>
            <h2>{bill.title || 'Split bill'}</h2>
          </div>
          <strong className="summary-total">{formatCurrency(bill.grand_total)}</strong>
        </div>

        <div className="bill-summary-meta">
          <dl className="summary-stats">
            <div><dt>Assigned subtotal</dt><dd>{formatCurrency(bill.assigned_subtotal)}</dd></div>
            <div><dt>Discount</dt><dd>-{formatCurrency(bill.total_discount_amount)}</dd></div>
            <div><dt>Tax ({bill.tax_rate}%)</dt><dd>{formatCurrency(bill.total_tax_amount)}</dd></div>
            <div><dt>Svc ({bill.service_rate}%)</dt><dd>{formatCurrency(bill.total_service_amount)}</dd></div>
          </dl>
        </div>

        <div className="bill-summary-grid">
          {(totals?.peopleTotals || []).map((person) => (
            <article key={person.id} className="bill-summary-card" style={{ '--person-color': person.color }}>
              <header>
                <div>
                  <h3>{person.name}</h3>
                  <span>Sub {formatCurrency(person.subtotal)} | -{formatCurrency(person.discountShare)} +{formatCurrency(person.taxShare + person.serviceShare)} fees</span>
                </div>
                <strong>{formatCurrency(person.total)}</strong>
              </header>
              <div className="summary-lines">
                {person.items.length === 0 ? <p>No items assigned.</p> : person.items.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="summary-line">
                    <span>{item.name} (x{item.quantity})</span>
                    <strong>{formatCurrency(item.share)}</strong>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {isAdmin && <SharePaymentLinks bill={bill} paymentProofs={paymentProofs} publicUrl={links.publicUrl} adminUrl={links.adminUrl} />}
      <PaymentTracker bill={bill} paymentProofs={paymentProofs} isAdmin={isAdmin} adminToken={adminToken} onProofUpdated={handleProofUpdated} />
      <button className="btn-secondary" type="button" onClick={loadBill}><RefreshCcw size={16} /> Refresh tracking</button>
    </div>
  );
}
