import React, { useMemo, useState } from 'react';
import { MessageCircle, RefreshCcw, Save } from 'lucide-react';
import PaymentTracker from './PaymentTracker';
import SharePaymentLinks from './SharePaymentLinks';
import { apiRequest } from '../utils/api';
import { appUrl } from '../utils/basePath';
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

  const paymentInfo = useMemo(() => [
    paymentMethod?.bankName && { label: 'Bank / wallet', value: paymentMethod.bankName },
    paymentMethod?.accountNumber && { label: 'Account number', value: paymentMethod.accountNumber },
    paymentMethod?.accountHolder && { label: 'Account holder', value: paymentMethod.accountHolder },
    paymentMethod?.qrisText && { label: 'QRIS / note', value: paymentMethod.qrisText }
  ].filter(Boolean), [paymentMethod]);

  const paymentLinks = useMemo(() => {
    if (!savedBill) return [];
    const basePublicUrl = shareLinks.publicUrl || appUrl(`/bill/${savedBill.id}`);
    return paymentProofs.map((proof) => ({
      personId: proof.person_id,
      name: proof.person_name,
      expectedAmount: Number(proof.expected_amount) || 0,
      url: `${basePublicUrl}/pay/${proof.person_id}`
    }));
  }, [paymentProofs, savedBill, shareLinks.publicUrl]);

  const publicBillUrl = savedBill ? (shareLinks.publicUrl || appUrl(`/bill/${savedBill.id}`)) : '';
  const adminBillUrl = savedBill
    ? (shareLinks.adminUrl || (savedBill.admin_token ? appUrl(`/bill/${savedBill.id}/admin/${savedBill.admin_token}`) : ''))
    : '';

  const buildWhatsAppMessage = () => {
    const personLines = peopleTotals
      .filter((person) => person.total > 0)
      .flatMap((person) => [
        `- ${person.name}: ${formatCurrency(person.total)}`,
        ...person.items.map((item) => `  - ${item.name} x${item.quantity}: ${formatCurrency(item.share)}`)
      ]);

    const paymentLines = paymentInfo.map((item) => `${item.label}: ${item.value}`);
    const linkLines = paymentLinks.map((link) => `- ${link.name}: ${formatCurrency(link.expectedAmount)}\n  ${link.url}`);

    return [
      'Bill Summary',
      '',
      'People totals:',
      ...personLines,
      '',
      'Bill totals:',
      `Subtotal: ${formatCurrency(assignedSubtotal)}`,
      `Discount: -${formatCurrency(totalDiscountAmt)}`,
      `Service (${serviceRate}%): ${formatCurrency(totalServiceAmt)}`,
      `Tax (${taxRate}%): ${formatCurrency(totalTaxAmt)}`,
      `Grand Total: ${formatCurrency(grandTotal)}`,
      ...(paymentLines.length > 0 ? ['', 'Payment destination:', ...paymentLines] : []),
      ...(publicBillUrl ? ['', `Public bill link: ${publicBillUrl}`] : []),
      ...(linkLines.length > 0 ? ['', 'Payment upload links:', ...linkLines] : []),
      ...(savedBill ? ['', 'Admin tracking link is kept out of this WhatsApp message for host privacy.'] : ['', 'Save the bill to generate payment upload links for each person.'])
    ].join('\n');
  };

  const handleShareToWhatsApp = () => {
    const message = buildWhatsAppMessage();
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

      <div className="summary-info-grid">
        <section className="summary-info-card">
          <h3>Payment destination</h3>
          {paymentInfo.length > 0 ? (
            <dl>
              {paymentInfo.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p>No bank or wallet details added yet.</p>
          )}
        </section>

        <section className="summary-info-card">
          <h3>Link information</h3>
          {savedBill ? (
            <dl>
              <div>
                <dt>Public bill link</dt>
                <dd>{publicBillUrl}</dd>
              </div>
              {adminBillUrl && (
                <div>
                  <dt>Admin tracking link</dt>
                  <dd>{adminBillUrl}</dd>
                </div>
              )}
              <div>
                <dt>Participant payment links</dt>
                <dd>{paymentLinks.length} generated</dd>
              </div>
            </dl>
          ) : (
            <p>Save the bill to generate public, admin, and participant payment links.</p>
          )}
        </section>
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
          <SharePaymentLinks bill={savedBill} paymentProofs={paymentProofs} publicUrl={shareLinks.publicUrl} adminUrl={shareLinks.adminUrl} paymentInfo={paymentInfo} />
          <PaymentTracker bill={savedBill} paymentProofs={paymentProofs} isAdmin adminToken={savedBill.admin_token} onProofUpdated={handleProofUpdated} />
        </div>
      )}
    </section>
  );
}
