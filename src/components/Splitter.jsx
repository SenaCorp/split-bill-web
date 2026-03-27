import React from 'react';

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

export default function Splitter({ items, people, assignments, setAssignments, onNext }) {
  const updatePortion = (item, personId, delta) => {
    const itemId = item.id;
    const quantity = getQuantity(item);
    const canShareSingleItem = isSharedSingleItem(item);

    setAssignments((prev) => {
      const currentAssigned = normalizeAssignmentMap(prev[itemId]);
      const currentPortion = Math.max(0, Number(currentAssigned[personId]) || 0);
      const currentTotal = Object.values(currentAssigned).reduce((sum, count) => sum + (Number(count) || 0), 0);

      if (delta > 0 && !canShareSingleItem && currentTotal >= quantity) {
        return prev;
      }

      const nextPortion = canShareSingleItem
        ? Math.max(0, Math.min(1, currentPortion + delta))
        : Math.max(0, currentPortion + delta);
      const nextAssigned = { ...currentAssigned, [personId]: nextPortion };

      if (nextPortion <= 0) {
        delete nextAssigned[personId];
      }

      if (Object.keys(nextAssigned).length === 0) {
        if (!prev[itemId]) {
          return prev;
        }
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      }

      return { ...prev, [itemId]: nextAssigned };
    });
  };

  const clearItemAssignment = (itemId) => {
    setAssignments((prev) => {
      if (!prev[itemId]) {
        return prev;
      }
      const { [itemId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const itemStates = items.map((item) => {
    const quantity = getQuantity(item);
    const assignedMap = normalizeAssignmentMap(assignments[item.id]);
    const assignedTotalPortion = Object.values(assignedMap).reduce((sum, count) => sum + (Number(count) || 0), 0);
    const assignedPeopleCount = Object.values(assignedMap).filter((count) => (Number(count) || 0) > 0).length;
    const canShareSingleItem = quantity === 1;

    return {
      itemId: item.id,
      quantity,
      assignedMap,
      assignedTotalPortion,
      assignedPeopleCount,
      canShareSingleItem,
      isValid: canShareSingleItem ? assignedPeopleCount > 0 : assignedTotalPortion === quantity
    };
  });

  const invalidItems = itemStates.filter((state) => !state.isValid).length;
  const canProceed = items.length > 0 && invalidItems === 0;

  return (
    <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', height: '85vh' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
        <h2>Assign Items</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Item quantity 1 bisa dibagi ke beberapa orang. Untuk quantity di atas 1, total porsi harus sama dengan quantity item.
        </p>
        {invalidItems > 0 && (
          <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {invalidItems} item belum valid.
          </p>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {items.map((item) => {
            const state = itemStates.find((entry) => entry.itemId === item.id);
            const assignedMap = state?.assignedMap || {};
            const quantity = state?.quantity || 1;
            const assignedTotalPortion = state?.assignedTotalPortion || 0;
            const assignedPeopleCount = state?.assignedPeopleCount || 0;
            const canShareSingleItem = state?.canShareSingleItem || false;
            const isAssigned = assignedTotalPortion > 0;
            const isValid = state?.isValid || false;
            const total = lineTotal(item);
            const unitPrice = quantity > 0 ? total / quantity : total;
            const sharedSingleItemShare = assignedPeopleCount > 0 ? total / assignedPeopleCount : 0;

            return (
              <div key={item.id} style={{
                background: isValid ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.05)',
                padding: '1rem',
                borderRadius: '12px',
                border: isValid ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239,68,68,0.35)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '1rem' }}>
                  <span style={{ fontWeight: 500 }}>{item.name} <small style={{ color: 'var(--text-secondary)' }}>({quantity}x)</small></span>
                  <span style={{ fontWeight: 600 }}>{total.toFixed(2)}</span>
                </div>

                <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: isValid ? 'var(--success)' : 'var(--danger)' }}>
                  {canShareSingleItem
                    ? `Dibagi ke ${assignedPeopleCount} orang`
                    : `Porsi terassign: ${assignedTotalPortion}/${quantity}`}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {people.map((person) => {
                    const portions = Math.max(0, Number(assignedMap[person.id]) || 0);
                    const share = canShareSingleItem
                      ? (portions > 0 ? sharedSingleItemShare : 0)
                      : portions * unitPrice;
                    return (
                      <div
                        key={person.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: portions > 0 ? person.color : 'rgba(255,255,255,0.08)',
                          color: portions > 0 ? 'white' : 'var(--text-secondary)',
                          border: portions > 0 ? `1px solid ${person.color}` : '1px solid rgba(255,255,255,0.1)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          opacity: portions > 0 ? 1 : 0.8
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => updatePortion(item, person.id, -1)}
                          style={{ all: 'unset', cursor: 'pointer', fontWeight: 700, padding: '0 0.25rem' }}
                          aria-label={`Kurangi porsi ${person.name} untuk ${item.name}`}
                        >
                          −
                        </button>
                        <span>{person.name} x{portions}</span>
                        <button
                          type="button"
                          onClick={() => updatePortion(item, person.id, 1)}
                          style={{ all: 'unset', cursor: 'pointer', fontWeight: 700, padding: '0 0.25rem' }}
                          aria-label={`Tambah porsi ${person.name} untuk ${item.name}`}
                        >
                          +
                        </button>
                        {portions > 0 && <span style={{ fontSize: '0.75em' }}> ({share.toFixed(2)})</span>}
                      </div>
                    );
                  })}
                </div>

                {isAssigned && !isValid && (
                  <div style={{ marginTop: '0.65rem', fontSize: '0.8rem', color: 'var(--danger)' }}>
                    {canShareSingleItem
                      ? 'Pilih minimal satu orang untuk item ini.'
                      : `Total porsi harus tepat ${quantity}. Sekarang: ${assignedTotalPortion}.`}
                  </div>
                )}

                {isAssigned && (
                  <button
                    type="button"
                    onClick={() => clearItemAssignment(item.id)}
                    style={{ all: 'unset', marginTop: '0.6rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                  >
                    Reset assignment item
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', textAlign: 'right', background: 'rgba(0,0,0,0.2)' }}>
        <button className="btn-primary" onClick={onNext} disabled={!canProceed} style={{ opacity: canProceed ? 1 : 0.5, cursor: canProceed ? 'pointer' : 'not-allowed' }}>
          View Summary
        </button>
      </div>
    </div>
  );
}
