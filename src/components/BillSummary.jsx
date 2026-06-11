import React, { useMemo, useState } from 'react';
import { MessageCircle, RefreshCcw, Save } from 'lucide-react';
import PaymentTracker from './PaymentTracker';
import SharePaymentLinks from './SharePaymentLinks';
import { apiRequest } from '../utils/api';
import { calculateBillTotals, formatCurrency } from '../utils/billCalculations';

export default function BillSummary({ items, people, assignments, taxRate, serviceRate, discountAmount, paymentMethod, onReset }) {
  const [savedBill, setSavedBill] = useState(null);
  const [paymentProofs, setPaymentProofs] = useState([]);
  const [shareLinks, setShareLinks] = useState({});
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { peopleTotals, assignedSubtotal, totalTaxAmt, totalServiceAmt, totalDiscountAmt, grandTotal, allSubtotal, unassignedSubtotal } = useMemo(() => (
    calculateBillTotals({ items, people, assignments, taxRate, serviceRate, discountAmount })
  ), [items, people, assignments, taxRate, serviceRate, discountAmount]);

  const handleShareToWhatsApp = () => {
    const billLines = peopleTotals
      .filter((person) => person.total > 0)
      .map((person) => `- ${person.name}: ${formatCurrency(person.total)}`);

    const message = [
      'Bill Summary',
      '',
      ...billLines,
      '',
      `Subtotal: ${formatCurrency(assignedSubtotal)}`,
      `Discount: -${formatCurrency(totalDiscountAmt)}`,
      `Service (${serviceRate}%): ${formatCurrency(totalServiceAmt)}`,
      `Tax (${taxRate}%): ${formatCurrency(totalTaxAmt)}`,
      `Grand Total: ${formatCurrency(grandTotal)}`
    ].join('\n');

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSaveBill = async () => {
    try {
      setIsSaving(true);
      setSaveError('');
      const paymentDetails = [
        paymentMethod?.bankName && `Bank/Wallet: ${paymentMethod.bankName}`,
        paymentMethod?.accountNumber && `Account: ${paymentMethod.accountNumber}`,
        paymentMethod?.accountHolder && `Holder: ${paymentMethod.accountHolder}`,
        paymentMethod?.qrisText && `Note: ${paymentMethod.qrisText}`
      ].filter(Boolean).join(' | ');

      const data = await apiRequest('/api/bills', {
        method: 'POST',
        body: JSON.stringify({
          title: paymentDetails ? `Split bill - ${paymentDetails}` : 'Split bill',
          receiptImageUrl: null,
          items,
          people,
          assignments,
          taxRate,
          serviceRate,
          discountAmount
        })
      });

      setSavedBill(data.bill);
      setPaymentProofs(data.paymentProofs || []);
      setShareLinks({ publicUrl: data.publicUrl, adminUrl: data.adminUrl });
    } catch (err) {
      setSaveError('Failed to save bill. Please check the API server and Supabase configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProofUpdated = (updatedProof) => {
    setPaymentProofs((current) => current.map((proof) => (
      proof.person_id === updatedProof.person_id ? updatedProof : proof
    )));
  };

  return (
    <section className="flow-card bill-summary-shell">
      <div className="flow-header summary-head">
        <div>
          <div className="section-label-bar">Final score</div>
          <h2>Bill summary</h2>
        </div>
        <strong className="summary-total">{formatCurrency(grandTotal)}</strong>
      </div>

      <div className="bill-summary-meta">
        <dl className="summary-stats">
          <div><dt>Assigned subtotal</dt><dd>{formatCurrency(assignedSubtotal)}</dd></div>
          <div><dt>Discount</dt><dd>-{formatCurrency(totalDiscountAmt)}</dd></div>
          <div><dt>Tax ({taxRate}%)</dt><dd>{formatCurrency(totalTaxAmt)}</dd></div>
          <div><dt>Svc ({serviceRate}%)</dt><dd>{formatCurrency(totalServiceAmt)}</dd></div>
        </dl>
        {unassignedSubtotal > 0 && (
          <div className="inline-error">
            Unassigned items subtotal: {formatCurrency(unassignedSubtotal)} of {formatCurrency(allSubtotal)}
          </div>
        )}
      </div>

      <div className="bill-summary-grid">
        {peopleTotals.map((person) => (
          <article key={person.id} className="bill-summary-card" style={{ '--person-color': person.color }}>
            <header>
              <div>
                <h3>{person.name}</h3>
                <span>Sub {formatCurrency(person.subtotal)} | -{formatCurrency(person.discountShare)} +{formatCurrency(person.taxShare + person.serviceShare)} fees</span>
              </div>
              <strong>{formatCurrency(person.total)}</strong>
            </header>
            <div className="summary-lines">
              {person.items.length === 0 ? (
                <p>No items assigned.</p>
              ) : (
                person.items.map((item, index) => (
                  <div key={index} className="summary-line">
                    <span>{item.name} (x{item.quantity})</span>
                    <strong>{formatCurrency(item.share)}</strong>
                  </div>
                ))
              )}
            </div>
          </article>
        ))}
      </div>

      {saveError && <div className="inline-error">{saveError}</div>}
      {savedBill && <div className="success-note">Bill saved. Payment tracking is enabled.</div>}

      <div className="flow-actions">
        <button className="btn-submit" onClick={handleShareToWhatsApp}>
          <MessageCircle size={17} /> Share to WhatsApp
        </button>
        <button className="btn-submit" onClick={handleSaveBill} disabled={isSaving || Boolean(savedBill)}>
          <Save size={17} /> {isSaving ? 'Saving...' : savedBill ? 'Payment Tracking Enabled' : 'Save Bill & Enable Payment Tracking'}
        </button>
        <button className="btn-secondary" onClick={onReset}>
          <RefreshCcw size={17} /> Start over
        </button>
      </div>

      {savedBill && (
        <div className="settlement-stack">
          <SharePaymentLinks bill={savedBill} paymentProofs={paymentProofs} publicUrl={shareLinks.publicUrl} adminUrl={shareLinks.adminUrl} />
          <PaymentTracker bill={savedBill} paymentProofs={paymentProofs} isAdmin adminToken={savedBill.admin_token} onProofUpdated={handleProofUpdated} />
        </div>
      )}
    </section>
  );
}
