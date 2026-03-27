import React from 'react';
import { RefreshCcw } from 'lucide-react';

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

    people.forEach((p) => {
      totals[p.id] = {
        name: p.name,
        color: p.color,
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

    people.forEach((p) => {
      const person = totals[p.id];
      if (assignedSubtotal <= 0 || person.subtotal <= 0) {
        return;
      }

      const ratio = person.subtotal / assignedSubtotal;
      person.discountShare = totalDiscountAmt * ratio;
      person.taxShare = totalTaxAmt * ratio;
      person.serviceShare = totalServiceAmt * ratio;
      person.total = person.subtotal - person.discountShare + person.taxShare + person.serviceShare;
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

  return (
    <div className="glass-panel animate-fade-in bill-summary-shell">
      <div className="bill-summary-header">
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Bill Summary</h2>

        <div className="bill-summary-meta">
          <div className="bill-summary-stats">
            <span>Assigned Subtotal: {assignedSubtotal.toFixed(2)}</span>
            <span>Discount: -{totalDiscountAmt.toFixed(2)}</span>
            <span>Tax ({taxRate}%): {totalTaxAmt.toFixed(2)}</span>
            <span>Svc ({serviceRate}%): {totalServiceAmt.toFixed(2)}</span>
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
            Grand Total: <span style={{ color: 'var(--success)' }}>{grandTotal.toFixed(2)}</span>
          </div>
          {unassignedSubtotal > 0 && (
            <div style={{ marginTop: '0.5rem', color: 'var(--danger)', fontSize: '0.85rem' }}>
              Unassigned items subtotal: {unassignedSubtotal.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      <div className="bill-summary-grid">
        {peopleTotals.map((person) => (
          <div key={person.name} className="bill-summary-card">
            <div style={{ background: person.color, padding: '1rem', color: '#1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', overflowWrap: 'anywhere' }}>{person.name}</h3>
                <span style={{ fontSize: '1.35rem', fontWeight: '800' }}>{person.total.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                Sub: {person.subtotal.toFixed(2)} | -{person.discountShare.toFixed(2)} +{(person.taxShare + person.serviceShare).toFixed(2)} fees
              </div>
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              {person.items.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No items assigned.</p>
              ) : (
                person.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.9rem', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.name} (x{item.quantity})</span>
                    <span>{item.share.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bill-summary-footer">
        <button className="btn-secondary" onClick={onReset} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}>
          <RefreshCcw size={18} /> Start Over
        </button>
      </div>
    </div>
  );
}
