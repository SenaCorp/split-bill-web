import React, { useEffect, useState } from 'react';
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

const parseRoute = () => {
  const segments = stripBasePath(window.location.pathname).split('/').filter(Boolean);
  if (segments[0] === 'design-system' || segments[0] === 'design-preview') {
    return { mode: 'design' };
  }

  if (segments[0] !== 'bill' || !segments[1]) {
    return { mode: 'home' };
  }

  if (segments[2] === 'pay' && segments[3]) {
    return { mode: 'pay', billId: segments[1], personId: segments[3] };
  }

  if (segments[2] === 'admin' && segments[3]) {
    return { mode: 'admin', billId: segments[1], adminToken: segments[3] };
  }

  return { mode: 'public', billId: segments[1] };
};

function App() {
  const [route, setRoute] = useState(parseRoute);
  const [step, setStep] = useState('upload'); // upload, processing, edit, people, split, summary
  const [image, setImage] = useState(null);
  const [items, setItems] = useState([]);
  const [people, setPeople] = useState([]);
  const [assignments, setAssignments] = useState({}); // { itemId: { [personId]: portionOrShareFlag } }

  const [taxRate, setTaxRate] = useState(10);
  const [serviceRate, setServiceRate] = useState(5);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    qrisText: ''
  });

  const isRemoteBillRoute = route.mode !== 'home';
  const isDesignRoute = route.mode === 'design';
  const remoteStepLabel = route.mode === 'pay' ? 'Pay' : route.mode === 'admin' ? 'Admin' : 'Bill';

  const steps = isRemoteBillRoute ? [
    { key: remoteStepLabel.toLowerCase(), label: remoteStepLabel }
  ] : [
    { key: 'upload', label: 'Upload' },
    { key: 'processing', label: 'Scan' },
    { key: 'edit', label: 'Edit' },
    { key: 'people', label: 'People' },
    { key: 'split', label: 'Split' },
    { key: 'summary', label: 'Result' }
  ];

  const activeStepIndex = isRemoteBillRoute ? 0 : Math.max(0, steps.findIndex((item) => item.key === step));

  const navigate = (path) => {
    window.history.pushState({}, '', withBasePath(path));
    setRoute(parseRoute());
  };

  useEffect(() => {
    const handlePopState = () => setRoute(parseRoute());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleImageUpload = (imgData) => {
    setImage(imgData);
    setStep('processing');
  };

  const handleItemsFound = (foundItems, foundTax = 0, foundService = 0) => {
    setItems(foundItems);
    setDiscountAmount(0);

    const subtotal = foundItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (subtotal > 0) {
      if (foundService > 0) {
        setServiceRate(parseFloat(((foundService / subtotal) * 100).toFixed(2)));
      }
      if (foundTax > 0) {
        const taxBase = subtotal + foundService;
        if (taxBase > 0) {
          setTaxRate(parseFloat(((foundTax / taxBase) * 100).toFixed(2)));
        }
      }
    }

    setStep('edit');
  };

  const handleItemsUpdate = (updatedItems) => {
    setItems(updatedItems);
  };

  const handleReset = () => {
    setStep('upload');
    setImage(null);
    setItems([]);
    setPeople([]);
    setAssignments({});
    setTaxRate(10);
    setServiceRate(5);
    setDiscountAmount(0);
    setPaymentMethod({ bankName: '', accountNumber: '', accountHolder: '', qrisText: '' });
  };

  if (isDesignRoute) {
    return <DesignPreview navigate={navigate} />;
  }

  return (
    <div className="app-page">
      <div className="console-shell">
        <div className="masthead">
          <div className="mascot-bubble">
            <span className="mascot-mark">SB</span>
            <span>Welcome to SplitBill.com</span>
          </div>
          <form className="search-module" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="site-search">Search</label>
            <input id="site-search" type="search" placeholder="Receipt, person, item" />
            <button type="submit" className="btn-chip">Go</button>
          </form>
        </div>

        <nav className="primary-nav" aria-label="Primary">
          <div className="logo-pill">splitbill</div>
          <span>Upload</span>
          <span>Scan</span>
          <span>Split</span>
          <span>Summary</span>
          <button type="button" className="btn-chip">Code Bank</button>
          <button type="button" className="btn-chip" onClick={() => navigate('/design-system')}>Design System</button>
        </nav>

        <div className="subnav-strip" aria-label="Workflow progress">
          {steps.map((item, index) => (
            <span
              key={item.key}
              className={`step-pill ${(isRemoteBillRoute || step === item.key) ? 'is-active' : ''} ${index < activeStepIndex ? 'is-complete' : ''}`}
            >
              {item.label}
            </span>
          ))}
        </div>

        <header className="hero-panel">
          <div>
            <p className="hero-kicker">Cream-canvas receipt workspace</p>
            <h1>Split Bill</h1>
            <p className="hero-tagline">Upload a receipt, verify each item, assign portions, and share a clear settlement plan.</p>
          </div>
          <span className="arrow-disc" aria-hidden="true">›</span>
        </header>

        <div className="content-grid">
          <aside className="left-rail" aria-label="Quick links">
            <span>Top Bills</span>
            <span>Recent</span>
            <span>People</span>
            <span>Help</span>
          </aside>

          <main className="workflow-panel" id="upload">
            {isRemoteBillRoute && <BillPage route={route} navigate={navigate} />}

            {!isRemoteBillRoute && step === 'upload' && <ImageUploader onImageUpload={handleImageUpload} />}

            {!isRemoteBillRoute && step === 'processing' && <ReceiptProcessor image={image} onItemsFound={handleItemsFound} />}

            {!isRemoteBillRoute && step === 'edit' && (
              <ItemEditor
                items={items}
                onUpdateItems={handleItemsUpdate}
                  taxRate={taxRate}
                setTaxRate={setTaxRate}
                  serviceRate={serviceRate}
                setServiceRate={setServiceRate}
                  discountAmount={discountAmount}
                setDiscountAmount={setDiscountAmount}
                onNext={() => setStep('people')}
              />
            )}

            {!isRemoteBillRoute && step === 'people' && <PersonSetup people={people} setPeople={setPeople} onNext={() => setStep('split')} />}

            {!isRemoteBillRoute && step === 'split' && (
              <Splitter
                items={items}
                  people={people}
                  assignments={assignments}
                setAssignments={setAssignments}
                onNext={() => setStep('summary')}
              />
            )}

            {!isRemoteBillRoute && step === 'summary' && (
              <>
                <PaymentMethodSetup paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
                <BillSummary
                  items={items}
                  people={people}
                  assignments={assignments}
                  taxRate={taxRate}
                  serviceRate={serviceRate}
                  discountAmount={discountAmount}
                  paymentMethod={paymentMethod}
                  onReset={handleReset}
                />
              </>
            )}
          </main>

          <aside className="action-rail" aria-label="Bill tools">
            <button type="button" className="rail-button">Login</button>
            <button type="button" className="rail-button">Subscribe</button>
            <button type="button" className="rail-button">Newsletter</button>
            <button type="button" className="rail-button">Help</button>

            <section className="info-box">
              <h2>How this flow works</h2>
              <p>Keep receipt scanning, item review, people, splits, and payment tracking in one focused workspace.</p>
            </section>

            <section className="promo-card">
              <span>V2</span>
              <strong>Group Pay</strong>
              <small>Warm, clear settlement tracking for shared meals.</small>
            </section>
          </aside>
        </div>

        <footer className="footer-bar">
          <span>©2026 Split Bill. Built as a compact chrome workflow.</span>
          <span className="esrb-badge">PRIVACY CERTIFIED</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
