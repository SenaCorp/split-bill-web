import React, { useMemo, useState } from 'react';
import { Copy, MessageCircle } from 'lucide-react';
import { formatCurrency } from '../utils/billCalculations';
import { appUrl } from '../utils/basePath';

export default function SharePaymentLinks({ bill, paymentProofs = [], publicUrl, adminUrl, paymentInfo = [] }) {
  const [copyStatus, setCopyStatus] = useState('');
  const basePublicUrl = publicUrl || appUrl(`/bill/${bill.id}`);
  const resolvedAdminUrl = adminUrl || (bill.admin_token ? appUrl(`/bill/${bill.id}/admin/${bill.admin_token}`) : '');

  const links = useMemo(() => paymentProofs.map((proof) => ({
    personId: proof.person_id,
    name: proof.person_name,
    expectedAmount: Number(proof.expected_amount) || 0,
    url: `${basePublicUrl}/pay/${proof.person_id}`
  })), [basePublicUrl, paymentProofs]);

  const message = useMemo(() => [
    `Bill Summary: ${bill.title || 'Split bill'}`,
    `Total: ${formatCurrency(bill.grand_total)}`,
    ...(paymentInfo.length > 0 ? [
      '',
      'Payment destination:',
      ...paymentInfo.map((item) => `${item.label}: ${item.value}`)
    ] : []),
    '',
    'Payment upload links:',
    ...links.map((link) => `- ${link.name}: ${formatCurrency(link.expectedAmount)}\n  ${link.url}`),
    '',
    'Please upload your payment proof after transfer. Admin tracking link is not included in this public message.'
  ].join('\n'), [bill, links, paymentInfo]);

  const copyText = async (text, label = 'Copied') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(label);
      setTimeout(() => setCopyStatus(''), 1800);
    } catch (err) {
      setCopyStatus('Copy failed. Select and copy manually.');
    }
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="flow-card share-links-shell">
      <div className="flow-header">
        <div>
          <div className="section-label-bar">Payment links</div>
          <h2>Share settlement access</h2>
        </div>
      </div>

      {copyStatus && <div className="success-note">{copyStatus}</div>}

      <div className="link-stack">
        <label>
          Public bill link
          <div className="copy-row">
            <input readOnly type="text" value={basePublicUrl} />
            <button className="btn-secondary" type="button" onClick={() => copyText(basePublicUrl, 'Public bill link copied')}><Copy size={15} /> Copy</button>
          </div>
        </label>
        {resolvedAdminUrl && (
          <label>
            Admin tracking link
            <div className="copy-row">
              <input readOnly type="text" value={resolvedAdminUrl} />
              <button className="btn-secondary" type="button" onClick={() => copyText(resolvedAdminUrl, 'Admin link copied')}><Copy size={15} /> Copy</button>
            </div>
          </label>
        )}
      </div>

      <div className="person-link-grid">
        {links.map((link) => (
          <article key={link.personId} className="person-link-card">
            <strong>{link.name}</strong>
            <span>{formatCurrency(link.expectedAmount)}</span>
            <button className="btn-secondary" type="button" onClick={() => copyText(link.url, `${link.name} link copied`)}><Copy size={15} /> Copy link</button>
          </article>
        ))}
      </div>

      <div className="flow-actions compact-actions">
        <button className="btn-submit" type="button" onClick={() => copyText(message, 'WhatsApp message copied')}>
          <Copy size={16} /> Copy all WhatsApp message
        </button>
        <button className="btn-secondary" type="button" onClick={openWhatsApp}>
          <MessageCircle size={16} /> Open WhatsApp
        </button>
      </div>
    </section>
  );
}
