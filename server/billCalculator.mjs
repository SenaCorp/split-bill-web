export const lineTotal = (item) => (Number(item.price) || 0) * (Number(item.quantity) || 1);
const normalizeAssignmentMap = (value) => {
  if (!value) return {};
  if (Array.isArray(value)) {
    return value.reduce((acc, personId) => ({ ...acc, [personId]: 1 }), {});
  }
  return value;
};

// Keep this calculation in sync with src/utils/billCalculations.js. The backend
// recalculates totals so client-submitted payment amounts cannot define the bill.
export const calculateBillTotals = ({ items = [], people = [], assignments = {}, taxRate = 0, serviceRate = 0, discountAmount = 0 }) => {
  const totals = {};
  let assignedSubtotal = 0;

  people.forEach((person) => {
    totals[person.id] = {
      id: person.id,
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
    const assignedEntries = Object.entries(assignedMap).filter(([personId, portion]) => (
      totals[personId] && (Number(portion) || 0) > 0
    ));
    if (!assignedEntries.length) return;

    const total = lineTotal(item);
    const totalWeight = assignedEntries.reduce((sum, [, portion]) => sum + Math.max(0, Number(portion) || 0), 0);
    if (totalWeight <= 0) return;

    assignedEntries.forEach(([pid, portion]) => {
      const safePortion = Math.max(0, Number(portion) || 0);
      const personShare = total * (safePortion / totalWeight);
      totals[pid].subtotal += personShare;
      totals[pid].items.push({ name: item.name, quantity: safePortion, share: personShare });
    });

    assignedSubtotal += total;
  });

  const safeServiceRate = Number(serviceRate) || 0;
  const safeTaxRate = Number(taxRate) || 0;
  const totalDiscountAmt = Math.min(Math.max(0, Number(discountAmount) || 0), assignedSubtotal);
  const discountedSubtotal = Math.max(0, assignedSubtotal - totalDiscountAmt);
  const totalServiceAmt = discountedSubtotal * (safeServiceRate / 100);
  const taxBase = discountedSubtotal + totalServiceAmt;
  const totalTaxAmt = taxBase * (safeTaxRate / 100);

  people.forEach((person) => {
    const personTotal = totals[person.id];
    if (assignedSubtotal <= 0 || personTotal.subtotal <= 0) return;
    const ratio = personTotal.subtotal / assignedSubtotal;
    personTotal.discountShare = totalDiscountAmt * ratio;
    personTotal.taxShare = totalTaxAmt * ratio;
    personTotal.serviceShare = totalServiceAmt * ratio;
    personTotal.total = personTotal.subtotal - personTotal.discountShare + personTotal.taxShare + personTotal.serviceShare;
  });

  const peopleTotals = Object.values(totals);
  const grandTotal = discountedSubtotal + totalTaxAmt + totalServiceAmt;

  return { peopleTotals, assignedSubtotal, totalTaxAmt, totalServiceAmt, totalDiscountAmt, grandTotal };
};
