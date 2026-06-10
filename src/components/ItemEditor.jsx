import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';

const lineTotal = (item) => (Number(item.price) || 0) * (Number(item.quantity) || 1);

export default function ItemEditor({
  items,
  onUpdateItems,
  taxRate,
  setTaxRate,
  serviceRate,
  setServiceRate,
  discountAmount,
  setDiscountAmount,
  onNext
}) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', quantity: '' });

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, price: item.price, quantity: item.quantity || 1 });
  };

  const saveEdit = (id) => {
    onUpdateItems(items.map((i) => (
      i.id === id
        ? {
          ...i,
          name: editForm.name,
          price: Number(editForm.price) || 0,
          quantity: Math.max(1, Number(editForm.quantity) || 1)
        }
        : i
    )));
    setEditingId(null);
  };

  const removeItem = (id) => {
    onUpdateItems(items.filter((i) => i.id !== id));
  };

  const addItem = () => {
    const newItem = {
      id: `manual-${Date.now()}`,
      name: 'New Item',
      price: 0,
      quantity: 1
    };
    onUpdateItems([...items, newItem]);
    startEdit(newItem);
  };

  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const appliedDiscount = Math.min(Math.max(0, Number(discountAmount) || 0), subtotal);
  const discountedSubtotal = Math.max(0, subtotal - appliedDiscount);
  const serviceAmount = discountedSubtotal * (serviceRate / 100);
  const taxBase = discountedSubtotal + serviceAmount;
  const taxAmount = taxBase * (taxRate / 100);
  const grandTotal = discountedSubtotal + taxAmount + serviceAmount;

  return (
    <section className="flow-card editor-card">
      <div className="flow-header">
        <div>
          <div className="section-label-bar">Official items</div>
          <h2>Verify items</h2>
        </div>
        <button className="btn-secondary" onClick={addItem}>
          <Plus size={16} /> Add item
        </button>
      </div>

      <div className="scroll-panel">
        {items.length === 0 && (
          <div className="empty-state">
            <strong>No receipt items found.</strong>
            <span>Add rows manually to continue the split.</span>
          </div>
        )}

        <div className="item-list">
          {items.map((item) => (
            <article key={item.id} className="news-row item-row">
              {editingId === item.id ? (
                <div className="edit-row">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                    autoFocus
                  />
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(event) => setEditForm({ ...editForm, price: event.target.value })}
                    placeholder="Unit"
                  />
                  <input
                    type="number"
                    min={1}
                    value={editForm.quantity}
                    onChange={(event) => setEditForm({ ...editForm, quantity: event.target.value })}
                    placeholder="Qty"
                  />
                  <button className="icon-action is-confirm" onClick={() => saveEdit(item.id)} aria-label={`Save ${item.name}`}>
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="item-main">
                    <strong>{item.name}</strong>
                    <span>{Number(item.quantity) || 1} x {(Number(item.price) || 0).toFixed(2)}</span>
                  </div>
                  <div className="item-actions">
                    <strong>{lineTotal(item).toFixed(2)}</strong>
                    <button className="icon-action" onClick={() => startEdit(item)} aria-label={`Edit ${item.name}`}>
                      <Edit2 size={15} />
                    </button>
                    <button className="icon-action is-danger" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </div>

      <div className="totals-panel">
        <div className="rate-grid">
          <label>
            <span>Tax (%)</span>
            <input
              type="number"
              value={taxRate}
              onChange={(event) => setTaxRate(Math.max(0, Number(event.target.value)))}
            />
          </label>
          <label>
            <span>Service (%)</span>
            <input
              type="number"
              value={serviceRate}
              onChange={(event) => setServiceRate(Math.max(0, Number(event.target.value)))}
            />
          </label>
          <label>
            <span>Discount</span>
            <input
              type="number"
              min={0}
              value={discountAmount}
              onChange={(event) => setDiscountAmount(Math.max(0, Number(event.target.value)))}
              placeholder="0"
            />
          </label>
        </div>

        <dl className="receipt-totals">
          <div><dt>Subtotal</dt><dd>{subtotal.toFixed(2)}</dd></div>
          <div><dt>Discount</dt><dd>-{appliedDiscount.toFixed(2)}</dd></div>
          <div><dt>Tax</dt><dd>{taxAmount.toFixed(2)}</dd></div>
          <div><dt>Service</dt><dd>{serviceAmount.toFixed(2)}</dd></div>
        </dl>

        <div className="grand-total">
          <span>Calculated total</span>
          <strong>{grandTotal.toFixed(2)}</strong>
          <button className="btn-submit" onClick={onNext}>Next: assign people</button>
        </div>
      </div>
    </section>
  );
}
