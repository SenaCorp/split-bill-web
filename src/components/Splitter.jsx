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
    <section className="flow-card splitter-card">
      <div className="flow-header">
        <div>
          <div className="section-label-bar">Player poll</div>
          <h2>Assign items</h2>
          <p>Quantity 1 can be shared by several people. Quantity above 1 must match the assigned portions.</p>
        </div>
        {invalidItems > 0 && <span className="status-badge is-error">{invalidItems} invalid</span>}
      </div>

      <div className="scroll-panel">
        <div className="assignment-list">
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
              <article key={item.id} className={`assignment-card ${isValid ? 'is-valid' : 'is-invalid'}`}>
                <div className="assignment-head">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{quantity}x item</span>
                  </div>
                  <strong>{total.toFixed(2)}</strong>
                </div>

                <div className={`assignment-status ${isValid ? 'is-valid' : 'is-invalid'}`}>
                  {canShareSingleItem
                    ? `Shared by ${assignedPeopleCount} people`
                    : `Assigned portions: ${assignedTotalPortion}/${quantity}`}
                </div>

                <div className="portion-grid">
                  {people.map((person) => {
                    const portions = Math.max(0, Number(assignedMap[person.id]) || 0);
                    const share = canShareSingleItem
                      ? (portions > 0 ? sharedSingleItemShare : 0)
                      : portions * unitPrice;
                    return (
                      <div key={person.id} className={`portion-chip ${portions > 0 ? 'is-active' : ''}`} style={{ '--person-color': person.color }}>
                        <button
                          type="button"
                          onClick={() => updatePortion(item, person.id, -1)}
                          aria-label={`Kurangi porsi ${person.name} untuk ${item.name}`}
                        >
                          -
                        </button>
                        <span>{person.name} x{portions}</span>
                        <button
                          type="button"
                          onClick={() => updatePortion(item, person.id, 1)}
                          aria-label={`Tambah porsi ${person.name} untuk ${item.name}`}
                        >
                          +
                        </button>
                        {portions > 0 && <small>{share.toFixed(2)}</small>}
                      </div>
                    );
                  })}
                </div>

                {isAssigned && !isValid && (
                  <div className="inline-error">
                    {canShareSingleItem
                      ? 'Choose at least one person for this item.'
                      : `Total portions must be ${quantity}. Current: ${assignedTotalPortion}.`}
                  </div>
                )}

                {isAssigned && (
                  <button type="button" onClick={() => clearItemAssignment(item.id)} className="text-button">
                    Reset assignment item
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </div>

      <div className="flow-actions">
        <button className="btn-submit" onClick={onNext} disabled={!canProceed}>
          View summary
        </button>
      </div>
    </section>
  );
}
