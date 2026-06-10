import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

const OPENAI_MODEL = 'gpt-5-mini';

const extractJson = (rawText) => {
  const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not find JSON object in AI response.');
  }
  return JSON.parse(jsonMatch[0]);
};

const readOutputText = (payload) => {
  if (payload.output_text && typeof payload.output_text === 'string') {
    return payload.output_text;
  }

  const chunks = [];
  (payload.output || []).forEach((entry) => {
    (entry.content || []).forEach((content) => {
      if (content.type === 'output_text' && content.text) {
        chunks.push(content.text);
      }
    });
  });

  return chunks.join('\n').trim();
};

export default function ReceiptProcessor({ image, onItemsFound }) {
  const [status, setStatus] = useState('Initializing OpenAI...');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!image) {
      return;
    }

    const processImage = async () => {
      setStatus('Sending receipt to OpenAI...');

      try {
        const prompt = `Analyze this receipt image and extract purchased items.

Rules:
- Include each purchased item with name, unit price, and quantity.
- If quantity is unclear, use 1.
- Use numbers only for price and quantity.
- Return tax and service as total amounts (not percentages).
- If missing, use 0 for tax or service.
- Return ONLY valid JSON, no markdown.

JSON format:
{
  "items": [
    { "name": "Item Name", "price": 10000, "quantity": 1 }
  ],
  "tax": 1000,
  "service": 500
}`;

        const response = await fetch('/api/receipt-ocr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: OPENAI_MODEL,
            input: [
              {
                role: 'user',
                content: [
                  { type: 'input_text', text: prompt },
                  { type: 'input_image', image_url: image }
                ]
              }
            ]
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 401) {
            throw new Error('Unauthorized from OpenAI proxy. Check OPENAI_API_KEY in your environment.');
          }
          throw new Error(`OCR API error ${response.status}: ${errText}`);
        }

        const payload = await response.json();
        const text = readOutputText(payload);

        if (!text) {
          throw new Error('OpenAI response did not contain text output.');
        }

        setStatus('Parsing AI response...');

        const data = extractJson(text);
        const validItems = Array.isArray(data.items)
          ? data.items.map((item, index) => ({
              id: `item-${Date.now()}-${index}`,
              name: item.name || 'Unknown Item',
              price: Number(item.price) || 0,
              quantity: Math.max(1, Number(item.quantity) || 1),
              originalLine: `${item.name || 'Unknown'} ${item.price || 0}`
            }))
          : [];

        onItemsFound(validItems, Number(data.tax) || 0, Number(data.service) || 0);
      } catch (err) {
        console.error('OpenAI OCR Error:', err);
        setError(`Failed to process receipt with OpenAI. ${err.message}`);
      }
    };

    processImage();
  }, [image, onItemsFound]);

  if (error) {
    return (
      <section className="flow-card state-card error-card">
        <div className="section-label-bar">Scan error</div>
        <div className="state-body">
          <AlertCircle size={42} />
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-submit">Try again</button>
        </div>
      </section>
    );
  }

  return (
    <section className="flow-card state-card">
      <div className="section-label-bar">Receipt scan</div>
      <div className="state-body">
        <Loader2 className="animate-spin" size={44} />
        <h2>Processing receipt</h2>
        <p>{status}</p>
        <small>Using {OPENAI_MODEL} via backend proxy. The API key stays on the server.</small>
      </div>
    </section>
  );
}
