# Split Bill 🧾✨

A modern web application that simplifies dividing restaurant bills or shared expenses. Upload a receipt photo, let AI extract the receipt items, then split the bill by person, item, and portion.

![Split Bill AI Demo](https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000&ixlib=rb-4.0.3)
*(Note: Replace with an actual screenshot of the app.)*

## 🚀 Features

- **AI Receipt Scanning**: Uses the **OpenAI Responses API** with vision input to extract receipt items, quantities, tax, and service amounts from an uploaded receipt photo.
- **Backend API Proxy**: Sends OCR requests through `/api/receipt-ocr` so `OPENAI_API_KEY` stays server-side instead of being exposed in browser DevTools.
- **Smart Parsing**: Converts AI output into editable item names, unit prices, quantities, tax totals, and service totals.
- **Interactive Editor**:
  - Fix any typos or scanning errors before splitting.
  - Add missing items manually.
  - Edit item unit price and quantity.
  - Adjust tax, service, and discount before assigning the bill.
- **Manual Discount Support**: Add a bill-level discount after receipt scanning. The app caps the discount to the subtotal and applies it before service and tax calculations.
- **Easy Splitting**:
  - Create profiles for everyone at the table.
  - Assign every item to one or multiple people.
  - Split quantity `1` items evenly between everyone selected.
  - Split quantity `2+` items by explicit portions per person.
- **Assignment Validation**: The app prevents moving to the summary until each item is valid:
  - Quantity `1` items need at least one assigned person.
  - Quantity `2+` items need assigned portions that exactly match the item quantity.
- **Detailed Bill Summary**:
  - Shows each person's subtotal, discount share, fees, item list, and final total.
  - Splits tax, service, and discount proportionally based on each person's assigned subtotal.
  - Highlights any unassigned subtotal if present.
- **WhatsApp Sharing**: Generate a formatted bill summary and open WhatsApp with the message ready to send.
- **Premium V2 UI**: Dark/light theme toggle, glassmorphism cards, step progress pills, animated header/orbs, responsive summary cards, and smooth transitions.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Language**: JavaScript
- **Styling**: Vanilla CSS with CSS variables, glassmorphism effects, Lucide React icons
- **Animation**: anime.js loaded from CDN for header and step animations
- **AI/OCR**: OpenAI Responses API (`gpt-5-mini`) with vision input
- **Containerization**: Docker, Docker Compose, Nginx

## 🐳 How to Run

### Option 1: Using Docker (Recommended)

The easiest way to run the app is using Docker. This builds a production-ready image served by Nginx with a backend proxy to OpenAI, so API keys are not exposed in browser DevTools.

1. Make sure Docker is installed.
2. Set your OpenAI API key in your shell or `.env` file:

   ```bash
   export OPENAI_API_KEY=your_openai_api_key_here
   ```

3. Run the following command in the project root:

   ```bash
   docker compose up -d --build
   ```

   Or, if you prefer plain Docker without Compose, run these commands to avoid stale container/image issues:

   ```bash
   docker rm -f split-bill-web 2>/dev/null || true
   docker build --no-cache -t split-bill-web .
   docker run -d --name split-bill-web -p 7771:80 -e OPENAI_API_KEY="$OPENAI_API_KEY" split-bill-web
   ```

4. Quick check for the OCR route. This should return a JSON error from OpenAI, **not** an Nginx 404:

   ```bash
   curl -i -X POST http://localhost:7771/api/receipt-ocr \
     -H 'content-type: application/json' \
     -d '{"model":"gpt-5-mini","input":"test"}'
   ```

   If you still see `404 Not Found` from Nginx, an old image/container may still be running. Re-run the plain Docker commands above and hard refresh the browser with Ctrl/Cmd+Shift+R.

5. Open your browser and visit:

   👉 **http://localhost:7771**

### Option 2: Local Development

Use this option if you want to edit the code or run it without Docker.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add your OpenAI key to `.env` as `OPENAI_API_KEY=...`.

   > Do not use a `VITE_` prefix for the API key. The Vite dev server proxy reads `OPENAI_API_KEY` server-side.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the link shown in the terminal, usually **http://localhost:5173**.

## 📂 Project Structure

```text
├── src/
│   ├── components/
│   │   ├── ImageUploader.jsx    # Drag-and-drop receipt image input
│   │   ├── ReceiptProcessor.jsx # OpenAI Responses API receipt extraction
│   │   ├── ItemEditor.jsx       # Edit parsed items, tax, service, and discount
│   │   ├── PersonSetup.jsx      # Add people who share the bill
│   │   ├── Splitter.jsx         # Assign items and portions to people
│   │   └── BillSummary.jsx      # Final calculation and WhatsApp sharing
│   ├── App.jsx                  # Main flow controller and animated shell
│   └── index.css                # Premium V2 theme and responsive styles
├── Dockerfile                   # Multi-stage build (Node -> Nginx)
├── docker-compose.yml           # Container orchestration
├── nginx.conf.template          # Nginx OpenAI proxy route template
└── vite.config.js               # Vite config with dev proxy to OpenAI
```

## 📝 Usage Guide

1. **Upload**: Drag and drop a receipt image.
2. **Scan**: Wait while the receipt is sent to OpenAI through the backend proxy.
3. **Edit**: Verify detected items. Add missing items or fix names, unit prices, and quantities.
4. **Adjust Fees**: Confirm or edit tax, service, and any bill-level discount.
5. **Add People**: Enter each person's name.
6. **Split**:
   - For quantity `1` items, select one or more people to split the item evenly.
   - For quantity `2+` items, use the `+` and `−` controls to assign exact portions.
   - Reset an item's assignment if you need to start over.
   - Continue only after all items are valid.
7. **Summary**:
   - Review each person's subtotal, discount share, tax/service share, item breakdown, and final total.
   - Share the result to WhatsApp or start over for another bill.

## 🧮 Calculation Notes

- Item line total = `unit price × quantity`.
- Quantity `1` items are split evenly across selected people.
- Quantity `2+` items are split by assigned portions, using `line total / quantity` as the unit price.
- Discount is applied to the assigned subtotal before service and tax.
- Service is calculated from the discounted assigned subtotal.
- Tax is calculated from `discounted assigned subtotal + service`.
- Discount, service, and tax are distributed proportionally according to each person's assigned subtotal.

---

Built with ❤️ by Babi & Fren's
