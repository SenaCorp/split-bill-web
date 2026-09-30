import React, { useCallback, useEffect, useState } from 'react';
import { Check, CircleDollarSign, Pencil, Receipt, RotateCcw, ScanLine, Sparkles, Users } from 'lucide-react';
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

const FLOW = [
  { key: 'upload', label: 'Struk', icon: Receipt },
  { key: 'processing', label: 'Pindai', icon: ScanLine },
  { key: 'edit', label: 'Periksa', icon: Pencil },
  { key: 'people', label: 'Teman', icon: Users },
  { key: 'split', label: 'Bagi', icon: CircleDollarSign },
  { key: 'summary', label: 'Beres', icon: Sparkles }
];

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
  const [route, setRoute] = useState(parseRoute);
  const [step, setStep] = useState('upload');
  const [image, setImage] = useState(null);
  const [items, setItems] = useState([]);
  const [people, setPeople] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [taxRate, setTaxRate] = useState(10);
  const [serviceRate, setServiceRate] = useState(5);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState({ bankName: '', accountNumber: '', accountHolder: '', qrisText: '' });
  const remote = route.mode !== 'home';

  const navigate = useCallback((path) => { window.history.pushState({}, '', withBasePath(path)); setRoute(parseRoute()); }, []);
  useEffect(() => { const onPop = () => setRoute(parseRoute()); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop); }, []);
  const handleItemsFound = useCallback((foundItems, foundTax = 0, foundService = 0) => {
    setItems(foundItems); setDiscountAmount(0);
    const subtotal = foundItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (subtotal > 0) {
      if (foundService > 0) setServiceRate(Number(((foundService / subtotal) * 100).toFixed(2)));
      if (foundTax > 0) setTaxRate(Number(((foundTax / (subtotal + foundService)) * 100).toFixed(2)));
    }
    setStep('edit');
  }, []);
  const reset = () => { setStep('upload'); setImage(null); setItems([]); setPeople([]); setAssignments({}); setTaxRate(10); setServiceRate(5); setDiscountAmount(0); setPaymentMethod({ bankName: '', accountNumber: '', accountHolder: '', qrisText: '' }); };

  if (route.mode === 'design') return <DesignPreview navigate={navigate} />;
  const context = remote ? (route.mode === 'pay' ? 'Bayar bagianmu' : route.mode === 'admin' ? 'Pantau pembayaran' : 'Rincian tagihan') : FLOW.find((x) => x.key === step)?.label;

  return <div className="app-page">
    <nav className="floating-nav" aria-label="Navigasi utama">
      <button className="brand-button" onClick={() => navigate('/')} aria-label="Beranda BarBa"><BrandMark /><span><strong>BarBa</strong><small>Bayar Bagi</small></span></button>
      <span className="nav-context">{context}</span>
      {!remote && step !== 'upload' ? <button className="nav-action" onClick={reset} aria-label="Mulai pembagian baru" title="Mulai lagi"><RotateCcw size={18} /><span>Mulai lagi</span></button> : <span className="nav-dot" aria-hidden="true" />}
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
