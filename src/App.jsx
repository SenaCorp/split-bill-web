import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, CircleDollarSign, Pencil, Receipt, ScanLine, Sparkles, Users } from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import ReceiptProcessor from './components/ReceiptProcessor';
import ItemEditor from './components/ItemEditor';
import PersonSetup from './components/PersonSetup';
import Splitter from './components/Splitter';
import BillSummary from './components/BillSummary';
import PaymentMethodSetup from './components/PaymentMethodSetup';
import BillPage from './components/BillPage';
import DesignPreview from './components/DesignPreview';
import { stripBasePath, withBasePath } from './utils/basePath';
import { clearWorkflow, DEFAULT_PAYMENT_METHOD, DEFAULT_WORKFLOW, loadWorkflow, saveWorkflow } from './utils/workflowStorage';

const FLOW = [
  { key: 'upload', label: 'Struk', icon: Receipt },
  { key: 'processing', label: 'Pindai', icon: ScanLine },
  { key: 'edit', label: 'Periksa', icon: Pencil },
  { key: 'people', label: 'Teman', icon: Users },
  { key: 'split', label: 'Bagi', icon: CircleDollarSign },
  { key: 'summary', label: 'Beres', icon: Sparkles }
];

const PREVIOUS_STEP = {
  processing: 'upload',
  edit: 'upload',
  people: 'edit',
  split: 'people',
  summary: 'split'
};

const parseRoute = () => {
  const segments = stripBasePath(window.location.pathname).split('/').filter(Boolean);
  if (segments[0] === 'design-system' || segments[0] === 'design-preview') return { mode: 'design' };
  if (segments[0] !== 'bill' || !segments[1]) return { mode: 'home' };
  if (segments[2] === 'pay' && segments[3]) return { mode: 'pay', billId: segments[1], personId: segments[3] };
  if (segments[2] === 'admin' && segments[3]) return { mode: 'admin', billId: segments[1], adminToken: segments[3] };
  return { mode: 'public', billId: segments[1] };
};

function BrandMark() {
  return <img className="brand-mark" src={withBasePath('/barba-logo.png')} alt="" aria-hidden="true" />;
}

function StepProgress({ step }) {
  const active = Math.max(0, FLOW.findIndex((item) => item.key === step));
  return (
    <div className="journey" aria-label={`Langkah ${active + 1} dari ${FLOW.length}: ${FLOW[active].label}`}>
      <div className="journey-mobile"><strong>{String(active + 1).padStart(2, '0')} / 06</strong><span>· {FLOW[active].label}</span></div>
      <div className="journey-rail"><span style={{ width: `${(active / (FLOW.length - 1)) * 100}%` }} /></div>
      <div className="journey-steps">
        {FLOW.map((item, index) => {
          const Icon = item.icon;
          return <div key={item.key} className={`journey-step ${index === active ? 'is-active' : ''} ${index < active ? 'is-complete' : ''}`} aria-current={index === active ? 'step' : undefined}>
            <span>{index < active ? <Check size={15} /> : <Icon size={16} />}</span><small>{item.label}</small>
          </div>;
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [initialWorkflow] = useState(loadWorkflow);
  const [route, setRoute] = useState(parseRoute);
  const [step, setStep] = useState(initialWorkflow.step);
  const [image, setImage] = useState(initialWorkflow.image);
  const [items, setItems] = useState(initialWorkflow.items);
  const [people, setPeople] = useState(initialWorkflow.people);
  const [assignments, setAssignments] = useState(initialWorkflow.assignments);
  const [taxRate, setTaxRate] = useState(initialWorkflow.taxRate);
  const [serviceRate, setServiceRate] = useState(initialWorkflow.serviceRate);
  const [discountAmount, setDiscountAmount] = useState(initialWorkflow.discountAmount);
  const [paymentMethod, setPaymentMethod] = useState(initialWorkflow.paymentMethod);
  const [showUploadWarning, setShowUploadWarning] = useState(false);
  const remote = route.mode !== 'home';

  const navigate = useCallback((path) => { window.history.pushState({}, '', withBasePath(path)); setRoute(parseRoute()); }, []);
  useEffect(() => { const onPop = () => setRoute(parseRoute()); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop); }, []);
  useEffect(() => {
    saveWorkflow({ step, image, items, people, assignments, taxRate, serviceRate, discountAmount, paymentMethod });
  }, [step, image, items, people, assignments, taxRate, serviceRate, discountAmount, paymentMethod]);
  useEffect(() => {
    if (!showUploadWarning) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowUploadWarning(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showUploadWarning]);
  const handleItemsFound = useCallback((foundItems, foundTax = 0, foundService = 0) => {
    setItems(foundItems); setDiscountAmount(0);
    const subtotal = foundItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (subtotal > 0) {
      if (foundService > 0) setServiceRate(Number(((foundService / subtotal) * 100).toFixed(2)));
      if (foundTax > 0) setTaxRate(Number(((foundTax / (subtotal + foundService)) * 100).toFixed(2)));
    }
    setStep('edit');
  }, []);
  const reset = () => {
    clearWorkflow();
    setStep(DEFAULT_WORKFLOW.step); setImage(DEFAULT_WORKFLOW.image); setItems([]); setPeople([]); setAssignments({});
    setTaxRate(DEFAULT_WORKFLOW.taxRate); setServiceRate(DEFAULT_WORKFLOW.serviceRate); setDiscountAmount(DEFAULT_WORKFLOW.discountAmount);
    setPaymentMethod({ ...DEFAULT_PAYMENT_METHOD });
  };
  const goBack = () => {
    if (PREVIOUS_STEP[step] === 'upload') {
      setShowUploadWarning(true);
      return;
    }
    setStep(PREVIOUS_STEP[step] || step);
  };

  const confirmUploadAgain = () => {
    setShowUploadWarning(false);
    setStep('upload');
  };

  if (route.mode === 'design') return <DesignPreview navigate={navigate} />;
  const context = remote ? (route.mode === 'pay' ? 'Bayar bagianmu' : route.mode === 'admin' ? 'Pantau pembayaran' : 'Rincian tagihan') : FLOW.find((x) => x.key === step)?.label;

  return <div className="app-page">
    {showUploadWarning && <div className="confirmation-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setShowUploadWarning(false);
    }}>
      <section className="confirmation-dialog" role="alertdialog" aria-modal="true" aria-labelledby="upload-warning-title" aria-describedby="upload-warning-description">
        <span className="confirmation-icon" aria-hidden="true"><AlertTriangle size={26} /></span>
        <div>
          <p className="section-label-bar">Konfirmasi</p>
          <h2 id="upload-warning-title">Upload foto struk lagi?</h2>
          <p id="upload-warning-description">Apakah Anda akan mengulang upload foto struk? Anda akan kembali ke langkah paling awal.</p>
        </div>
        <div className="confirmation-actions">
          <button className="btn-secondary" onClick={() => setShowUploadWarning(false)} autoFocus>Tetap di sini</button>
          <button className="btn-submit" onClick={confirmUploadAgain}>Ya, upload ulang</button>
        </div>
      </section>
    </div>}
    <nav className="floating-nav" aria-label="Navigasi utama">
      <button className="brand-button" onClick={() => navigate('/')} aria-label="Beranda BarBa"><BrandMark /><span><strong>BarBa</strong><small>Bayar Bagi</small></span></button>
      <span className="nav-context">{context}</span>
      {!remote && step !== 'upload' ? <button className="nav-action" onClick={goBack} aria-label="Kembali ke langkah sebelumnya" title="Kembali"><ArrowLeft size={18} /><span>Kembali</span></button> : <span className="nav-dot" aria-hidden="true" />}
    </nav>
    <div className="app-shell">
      {!remote && <StepProgress step={step} />}
      <main className={`workflow-panel step-${step}`}>
        {remote && <BillPage route={route} navigate={navigate} />}
        {!remote && step === 'upload' && <ImageUploader onImageUpload={(data) => { setImage(data); setStep('processing'); }} />}
        {!remote && step === 'processing' && <ReceiptProcessor image={image} onItemsFound={handleItemsFound} />}
        {!remote && step === 'edit' && <ItemEditor items={items} onUpdateItems={setItems} taxRate={taxRate} setTaxRate={setTaxRate} serviceRate={serviceRate} setServiceRate={setServiceRate} discountAmount={discountAmount} setDiscountAmount={setDiscountAmount} onNext={() => setStep('people')} />}
        {!remote && step === 'people' && <PersonSetup people={people} setPeople={setPeople} onNext={() => setStep('split')} />}
        {!remote && step === 'split' && <Splitter items={items} people={people} assignments={assignments} setAssignments={setAssignments} onNext={() => setStep('summary')} />}
        {!remote && step === 'summary' && <><PaymentMethodSetup paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} /><BillSummary items={items} people={people} assignments={assignments} taxRate={taxRate} serviceRate={serviceRate} discountAmount={discountAmount} paymentMethod={paymentMethod} onReset={reset} /></>}
      </main>
      <footer><BrandMark /> <span>BarBa · Hitungnya rapi, bayarnya enak.</span></footer>
    </div>
  </div>;
}
