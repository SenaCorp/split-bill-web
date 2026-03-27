import React, { useState, useEffect, useRef } from 'react';
import ImageUploader from './components/ImageUploader';
import ReceiptProcessor from './components/ReceiptProcessor';
import ItemEditor from './components/ItemEditor';
import PersonSetup from './components/PersonSetup';
import Splitter from './components/Splitter';
import BillSummary from './components/BillSummary';
import { Moon, Sun } from 'lucide-react';

const ANIME_CDN = 'https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js';

function App() {
  const [step, setStep] = useState('upload'); // upload, processing, edit, people, split, summary
  const [image, setImage] = useState(null);
  const [items, setItems] = useState([]);
  const [people, setPeople] = useState([]);
  const [assignments, setAssignments] = useState({}); // { itemId: { [personId]: portionOrShareFlag } }

  // Tax, Service & Discount State
  const [taxRate, setTaxRate] = useState(10);
  const [serviceRate, setServiceRate] = useState(5);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Theme State
  const [theme, setTheme] = useState('dark');
  const [headerAnimated, setHeaderAnimated] = useState(false);

  const steps = [
    { key: 'upload', label: 'Upload' },
    { key: 'processing', label: 'Scan' },
    { key: 'edit', label: 'Edit' },
    { key: 'people', label: 'Bestie' },
    { key: 'split', label: 'Split' },
    { key: 'summary', label: 'Result' }
  ];

  const headerRef = useRef(null);
  const stepContentRef = useRef(null);
  const animeRef = useRef(null);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const playHeaderAnimation = () => {
      if (!animeRef.current || !headerRef.current) {
        return;
      }

      animeRef.current.timeline({ easing: 'easeOutExpo', duration: 750 })
        .add({
          targets: '.title-line',
          translateY: [22, 0],
          opacity: [0, 1],
          delay: animeRef.current.stagger(110)
        })
        .add({
          targets: '.theme-toggle',
          scale: [0.8, 1],
          rotate: ['-12deg', '0deg'],
          opacity: [0, 1]
        }, '-=550')
        .add({
          targets: '.anime-orb',
          opacity: [0, 1],
          scale: [0.6, 1],
          translateY: [16, 0],
          delay: animeRef.current.stagger(120)
        }, '-=650');

      animeRef.current({
        targets: '.version-pill',
        scale: [1, 1.08, 1],
        duration: 2200,
        easing: 'easeInOutSine',
        loop: true
      });

      animeRef.current({
        targets: '.anime-orb-left',
        translateY: [-8, 12, -8],
        translateX: [0, -10, 0],
        duration: 4200,
        easing: 'easeInOutSine',
        loop: true
      });

      animeRef.current({
        targets: '.anime-orb-right',
        translateY: [10, -12, 10],
        translateX: [0, 12, 0],
        duration: 4600,
        easing: 'easeInOutSine',
        loop: true
      });

      setHeaderAnimated(true);
    };

    if (window.anime) {
      animeRef.current = window.anime;
      playHeaderAnimation();
      return;
    }

    const existingScript = document.querySelector(`script[data-anime="${ANIME_CDN}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', playHeaderAnimation, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = ANIME_CDN;
    script.async = true;
    script.dataset.anime = ANIME_CDN;
    script.onload = () => {
      animeRef.current = window.anime;
      playHeaderAnimation();
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!animeRef.current || !stepContentRef.current) {
      return;
    }

    animeRef.current({
      targets: stepContentRef.current,
      opacity: [0, 1],
      translateY: [18, 0],
      scale: [0.98, 1],
      duration: 420,
      easing: 'easeOutQuart'
    });
  }, [step]);


  useEffect(() => {
    if (!headerAnimated || !animeRef.current) {
      return;
    }

    animeRef.current.remove('.step-pill.is-active');
    animeRef.current({
      targets: '.step-pill.is-active',
      scale: [0.92, 1.05, 1],
      duration: 520,
      easing: 'easeOutBack'
    });
  }, [step, headerAnimated]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    if (animeRef.current) {
      animeRef.current({
        targets: '.theme-toggle',
        scale: [1, 0.88, 1],
        duration: 380,
        easing: 'easeOutBack'
      });
    }
  };

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
    <div className="container">
      <div className="anime-orb anime-orb-left" aria-hidden="true" />
      <div className="anime-orb anime-orb-right" aria-hidden="true" />
      <header
        ref={headerRef}
        className="app-header"
      >
        <span className="version-pill title-line">V2</span>
        <button
          onClick={toggleTheme}
          className="glass-panel theme-toggle"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} color="var(--text-primary)" /> : <Moon size={20} color="var(--text-primary)" />}
        </button>

        <h1
          className="title-line app-title"
        >
          Split Bill Babitampan
        </h1>
        <p className="title-line app-subtitle">Upload struk, bagi patungan, tetap bestie-an. 😎</p>
        <div className="step-pill-wrap title-line" style={{ opacity: 0 }}>
          {steps.map((item) => (
            <span
              key={item.key}
              className={`step-pill ${step === item.key ? 'is-active' : ''}`}
            >
              {item.label}
            </span>
          ))}
        </div>
      </header>

      <main ref={stepContentRef} className="step-shell" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
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
    </div>
  );
}

export default App;
