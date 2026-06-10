import React from 'react';
import { MessageCircle, RefreshCcw } from 'lucide-react';

const lineTotal = (item) => (Number(item.price) || 0) * (Number(item.quantity) || 1);
const getQuantity = (item) => Math.max(1, Number(item.quantity) || 1);
const isSharedSingleItem = (item) => getQuantity(item) === 1;

const normalizeAssignmentMap = (value) => {
  if (!value) {
    return {};
  }

  if (Array.isArray(value)) {
    return value.reduce((acc, personId) => ({ ...acc, [personId]: 1 }), {});
  }

  return value;
};

export default function BillSummary({ items, people, assignments, taxRate, serviceRate, discountAmount, onReset }) {
  const calculateTotals = () => {
    const totals = {};
    let assignedSubtotal = 0;

    people.forEach((person) => {
      totals[person.id] = {
        name: person.name,
        color: person.color,
        subtotal: 0,
        taxShare: 0,
        serviceShare: 0,
        discountShare: 0,
        total: 0,
        items: []
      };
    });

    items.forEach((item) => {
      const assignedMap = normalizeAssignmentMap(assignments[item.id]);
      const assignedEntries = Object.entries(assignedMap).filter(([, portion]) => (Number(portion) || 0) > 0);

      if (!assignedEntries.length) {
        return;
      }

      const quantity = getQuantity(item);
      const total = lineTotal(item);
      const unitPrice = quantity > 0 ? total / quantity : total;
      const canShareSingleItem = isSharedSingleItem(item);

      let itemAssignedSubtotal = 0;

      assignedEntries.forEach(([pid, portion]) => {
        if (!totals[pid]) {
          return;
        }

        const safePortion = Math.max(0, Number(portion) || 0);
        const personShare = canShareSingleItem
          ? total / assignedEntries.length
          : safePortion * unitPrice;
        itemAssignedSubtotal += personShare;

        totals[pid].subtotal += personShare;
        totals[pid].items.push({
          name: item.name,
          quantity: canShareSingleItem ? 1 : safePortion,
          share: personShare
        });
      });

      assignedSubtotal += canShareSingleItem ? total : Math.min(total, itemAssignedSubtotal);
    });

    const totalDiscountAmt = Math.min(Math.max(0, Number(discountAmount) || 0), assignedSubtotal);
    const discountedSubtotal = Math.max(0, assignedSubtotal - totalDiscountAmt);
    const totalServiceAmt = discountedSubtotal * (serviceRate / 100);
    const taxBase = discountedSubtotal + totalServiceAmt;
    const totalTaxAmt = taxBase * (taxRate / 100);

    people.forEach((person) => {
      const personTotal = totals[person.id];
      if (assignedSubtotal <= 0 || personTotal.subtotal <= 0) {
        return;
      }

      const ratio = personTotal.subtotal / assignedSubtotal;
      personTotal.discountShare = totalDiscountAmt * ratio;
      personTotal.taxShare = totalTaxAmt * ratio;
      personTotal.serviceShare = totalServiceAmt * ratio;
      personTotal.total = personTotal.subtotal - personTotal.discountShare + personTotal.taxShare + personTotal.serviceShare;
    });

    return {
      peopleTotals: Object.values(totals),
      assignedSubtotal,
      totalTaxAmt,
      totalServiceAmt,
      totalDiscountAmt
    };
  };

  const { peopleTotals, assignedSubtotal, totalTaxAmt, totalServiceAmt, totalDiscountAmt } = calculateTotals();
  const allSubtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const grandTotal = Math.max(0, assignedSubtotal - totalDiscountAmt) + totalTaxAmt + totalServiceAmt;
  const unassignedSubtotal = allSubtotal - assignedSubtotal;

  const handleShareToWhatsApp = () => {
    const billLines = peopleTotals
      .filter((person) => person.total > 0)
      .map((person) => `- ${person.name}: ${person.total.toFixed(2)}`);

    const message = [
      'Bill Summary',
      '',
      ...billLines,
      '',
      `Subtotal: ${assignedSubtotal.toFixed(2)}`,
      `Discount: -${totalDiscountAmt.toFixed(2)}`,
      `Service (${serviceRate}%): ${totalServiceAmt.toFixed(2)}`,
      `Tax (${taxRate}%): ${totalTaxAmt.toFixed(2)}`,
      `Grand Total: ${grandTotal.toFixed(2)}`
    ].join('\n');

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="flow-card bill-summary-shell">
      <div className="flow-header summary-head">
        <div>
          <div className="section-label-bar">Final score</div>
          <h2>Bill summary</h2>
        </div>
        <strong className="summary-total">{grandTotal.toFixed(2)}</strong>
      </div>

      <div className="bill-summary-meta">
        <dl className="summary-stats">
          <div><dt>Assigned subtotal</dt><dd>{assignedSubtotal.toFixed(2)}</dd></div>
          <div><dt>Discount</dt><dd>-{totalDiscountAmt.toFixed(2)}</dd></div>
          <div><dt>Tax ({taxRate}%)</dt><dd>{totalTaxAmt.toFixed(2)}</dd></div>
          <div><dt>Svc ({serviceRate}%)</dt><dd>{totalServiceAmt.toFixed(2)}</dd></div>
        </dl>
        {unassignedSubtotal > 0 && (
          <div className="inline-error">
            Unassigned items subtotal: {unassignedSubtotal.toFixed(2)}
          </div>
        )}
      </div>

      <div className="bill-summary-grid">
        {peopleTotals.map((person) => (
          <article key={person.name} className="bill-summary-card" style={{ '--person-color': person.color }}>
            <header>
              <div>
                <h3>{person.name}</h3>
                <span>Sub {person.subtotal.toFixed(2)} | -{person.discountShare.toFixed(2)} +{(person.taxShare + person.serviceShare).toFixed(2)} fees</span>
              </div>
              <strong>{person.total.toFixed(2)}</strong>
            </header>
            <div className="summary-lines">
              {person.items.length === 0 ? (
                <p>No items assigned.</p>
              ) : (
                person.items.map((item, index) => (
                  <div key={index} className="summary-line">
                    <span>{item.name} (x{item.quantity})</span>
                    <strong>{item.share.toFixed(2)}</strong>
                  </div>
                ))
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="flow-actions">
        <button className="btn-submit" onClick={handleShareToWhatsApp}>
          <MessageCircle size={17} /> Share to WhatsApp
        </button>
        <button className="btn-secondary" onClick={onReset}>
          <RefreshCcw size={17} /> Start over
        </button>
      </div>
    </section>
  );
}
