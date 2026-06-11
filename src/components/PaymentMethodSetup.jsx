import React from 'react';

export default function PaymentMethodSetup({ paymentMethod, setPaymentMethod }) {
  const updateField = (field, value) => {
    setPaymentMethod((current) => ({ ...current, [field]: value }));
  };

  return (
    <section className="payment-method-panel">
      <div className="section-label-bar">Payment destination</div>
      <div className="payment-method-grid">
        <label>
          Bank / Wallet
          <input
            type="text"
            value={paymentMethod.bankName}
            onChange={(event) => updateField('bankName', event.target.value)}
            placeholder="BCA / Mandiri / GoPay"
          />
        </label>
        <label>
          Account number
          <input
            type="text"
            value={paymentMethod.accountNumber}
            onChange={(event) => updateField('accountNumber', event.target.value)}
            placeholder="1234567890"
          />
        </label>
        <label>
          Account holder
          <input
            type="text"
            value={paymentMethod.accountHolder}
            onChange={(event) => updateField('accountHolder', event.target.value)}
            placeholder="Host name"
          />
        </label>
        <label>
          QRIS / payment note
          <input
            type="text"
            value={paymentMethod.qrisText}
            onChange={(event) => updateField('qrisText', event.target.value)}
            placeholder="QRIS available on request"
          />
        </label>
      </div>
      <p className="muted-copy">These details are included in the bill title/metadata for now and can be copied into WhatsApp messages.</p>
    </section>
  );
}
