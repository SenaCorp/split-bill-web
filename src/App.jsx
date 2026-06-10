import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import ReceiptProcessor from './components/ReceiptProcessor';
import ItemEditor from './components/ItemEditor';
import PersonSetup from './components/PersonSetup';
import Splitter from './components/Splitter';
import BillSummary from './components/BillSummary';

function App() {
  const [step, setStep] = useState('upload'); // upload, processing, edit, people, split, summary
  const [image, setImage] = useState(null);
  const [items, setItems] = useState([]);
  const [people, setPeople] = useState([]);
  const [assignments, setAssignments] = useState({}); // { itemId: { [personId]: portionOrShareFlag } }

  const [taxRate, setTaxRate] = useState(10);
  const [serviceRate, setServiceRate] = useState(5);
  const [discountAmount, setDiscountAmount] = useState(0);

  const steps = [
    { key: 'upload', label: 'Upload' },
    { key: 'processing', label: 'Scan' },
    { key: 'edit', label: 'Edit' },
    { key: 'people', label: 'People' },
    { key: 'split', label: 'Split' },
    { key: 'summary', label: 'Result' }
  ];

  const activeStepIndex = Math.max(0, steps.findIndex((item) => item.key === step));

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
  };

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
          <button type="button" className="btn-chip">Bill Finder</button>
        </nav>

        <div className="subnav-strip" aria-label="Workflow progress">
          {steps.map((item, index) => (
            <span
              key={item.key}
              className={`step-pill ${step === item.key ? 'is-active' : ''} ${index < activeStepIndex ? 'is-complete' : ''}`}
            >
              {item.label}
            </span>
          ))}
        </div>

        <header className="hero-panel">
          <div>
            <p className="hero-kicker">Receipt control center</p>
            <h1>Split Bill</h1>
            <p className="hero-tagline">Upload struk, verify the lines, assign portions, and send the final total.</p>
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
            {step === 'upload' && <ImageUploader onImageUpload={handleImageUpload} />}

            {step === 'processing' && <ReceiptProcessor image={image} onItemsFound={handleItemsFound} />}

            {step === 'edit' && (
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

            {step === 'people' && <PersonSetup people={people} setPeople={setPeople} onNext={() => setStep('split')} />}

            {step === 'split' && (
              <Splitter
                items={items}
                people={people}
                assignments={assignments}
                setAssignments={setAssignments}
                onNext={() => setStep('summary')}
              />
            )}

            {step === 'summary' && (
              <BillSummary
                items={items}
                people={people}
                assignments={assignments}
                taxRate={taxRate}
                serviceRate={serviceRate}
                discountAmount={discountAmount}
                onReset={handleReset}
              />
            )}
          </main>

          <aside className="action-rail" aria-label="Bill tools">
            <button type="button" className="rail-button">Login</button>
            <button type="button" className="rail-button">Subscribe</button>
            <button type="button" className="rail-button">Newsletter</button>
            <button type="button" className="rail-button">Help</button>

            <section className="info-box">
              <h2>What is bill finder?</h2>
              <p>Keep the receipt flow in one compact control panel. Each plate below advances the same bill without changing the saved math.</p>
            </section>

            <section className="promo-card">
              <span>V2</span>
              <strong>Group Pay Advance</strong>
              <small>Receipt splits for table-sized chaos.</small>
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
