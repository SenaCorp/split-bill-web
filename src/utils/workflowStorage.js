export const WORKFLOW_STORAGE_KEY = 'barba:split-bill-workflow:v1';

export const DEFAULT_PAYMENT_METHOD = {
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  qrisText: ''
};

export const DEFAULT_WORKFLOW = {
  step: 'upload',
  image: null,
  items: [],
  people: [],
  assignments: {},
  taxRate: 10,
  serviceRate: 5,
  discountAmount: 0,
  paymentMethod: DEFAULT_PAYMENT_METHOD
};

const VALID_STEPS = ['upload', 'processing', 'edit', 'people', 'split', 'summary'];

export const loadWorkflow = (storage = window.localStorage) => {
  try {
    const saved = JSON.parse(storage.getItem(WORKFLOW_STORAGE_KEY));
    if (!saved || typeof saved !== 'object') return DEFAULT_WORKFLOW;

    const restored = {
      ...DEFAULT_WORKFLOW,
      ...saved,
      items: Array.isArray(saved.items) ? saved.items : [],
      people: Array.isArray(saved.people) ? saved.people : [],
      assignments: saved.assignments && typeof saved.assignments === 'object' ? saved.assignments : {},
      paymentMethod: {
        ...DEFAULT_PAYMENT_METHOD,
        ...(saved.paymentMethod && typeof saved.paymentMethod === 'object' ? saved.paymentMethod : {})
      }
    };

    if (!VALID_STEPS.includes(restored.step)) restored.step = 'upload';
    if (restored.step === 'processing' && !restored.image) restored.step = 'upload';
    if (['edit', 'people', 'split', 'summary'].includes(restored.step) && restored.items.length === 0) restored.step = 'upload';
    if (['split', 'summary'].includes(restored.step) && restored.people.length === 0) restored.step = 'people';

    return restored;
  } catch {
    return DEFAULT_WORKFLOW;
  }
};

export const saveWorkflow = (workflow, storage = window.localStorage) => {
  try {
    storage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(workflow));
  } catch {
    // A large receipt image can exceed the browser quota. Keep the remaining
    // editable workflow instead of losing all progress.
    try {
      storage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify({ ...workflow, image: null }));
    } catch {
      // Storage can be unavailable in private/restricted browser contexts.
    }
  }
};

export const clearWorkflow = (storage = window.localStorage) => {
  try {
    storage.removeItem(WORKFLOW_STORAGE_KEY);
  } catch {
    // Reset the in-memory flow even when browser storage is unavailable.
  }
};
