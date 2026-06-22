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
- **Containerization**: Docker, Docker Compose, Node/Express static serving

## 🐳 How to Run

### Option 1: Using Docker (Recommended)

The easiest way to run the app is using Docker. This builds a production-ready React bundle and serves it from the Node/Express API, so OpenAI, Supabase, and MinIO secrets are not exposed in browser DevTools.

1. Make sure Docker is installed.
2. Set your OpenAI, Supabase, and public MinIO settings in your shell or `.env` file:

   ```bash
   export OPENAI_API_KEY=your_openai_api_key_here
   export SUPABASE_URL=https://your-project.supabase.co
   export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   export MINIO_ENDPOINT=minio.example.com
   export MINIO_PORT=443
   export MINIO_USE_SSL=true
   export MINIO_ACCESS_KEY=your_minio_access_key
   export MINIO_SECRET_KEY=your_minio_secret_key
   export MINIO_BUCKET=split-bill-proofs
   ```

3. Run the following command in the project root:

   ```bash
   docker compose up -d --build
   ```

   Or, if you prefer plain Docker without Compose, run these commands to avoid stale container/image issues:

   ```bash
   docker rm -f split-bill-web 2>/dev/null || true
   docker build --no-cache -t split-bill-web .
   docker run -d --name split-bill-web -p 7771:3000 --env-file .env split-bill-web
   ```

4. Quick check for the OCR route. This should return a JSON error from OpenAI, **not** a static-file 404:

   ```bash
   curl -i -X POST http://localhost:7771/api/receipt-ocr \
     -H 'content-type: application/json' \
     -d '{"model":"gpt-5-mini","input":"test"}'
   ```

   If you still see `404 Not Found`, an old image/container may still be running. Re-run the plain Docker commands above and hard refresh the browser with Ctrl/Cmd+Shift+R.

5. Open your browser and visit:

   👉 **http://localhost:7771**

### Option 2: Local Development

Use this option if you want to edit the code or run it without Docker.

1. Install dependencies:

   ```bash
   npm install --legacy-peer-deps
   ```

2. Add your OpenAI, Supabase, and MinIO settings to `.env` (use `.env.example` as a template).

   > Do not use a `VITE_` prefix for secret keys. The Express API reads `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and MinIO credentials server-side.

3. Start the frontend only when you are working on static UI screens:

   ```bash
   npm run dev
   ```

   For OCR, bill saving, and payment tracking endpoints, run the frontend and API together:

   ```bash
   npm run dev:full
   ```

4. Open the link shown in the terminal, usually **http://localhost:5173**.


### Serving from a path prefix

If the app is published below a subpath such as `https://sena.my.id/split-bill`, configure the same prefix at build time and runtime:

```bash
export APP_BASE_PATH=/split-bill
export APP_BASE_URL=https://sena.my.id/split-bill
docker compose up -d --build
```

`APP_BASE_PATH` makes Vite emit prefixed asset URLs such as `/split-bill/assets/...` and lets the Express server return the built app for `/split-bill` routes. `APP_BASE_URL` controls the public bill links returned by the API.

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
├── server/                      # Express API, Supabase, MinIO, and OCR proxy
├── supabase/migrations/         # Database schema for saved bills and proofs
├── Dockerfile                   # Multi-stage build (Vite -> Node/Express)
├── docker-compose.yml           # App orchestration with external MinIO config
└── vite.config.js               # Vite config with dev API proxy
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

## 💸 Payment Proof Upload & Settlement Tracker

The app now includes an end-to-end settlement flow after the bill summary:

- Save the final split into Supabase with a server-generated `admin_token`.
- Create one `payment_proofs` row per person.
- Share `/bill/:billId/pay/:personId` links so participants can upload JPG, PNG, WEBP, or PDF payment proof files.
- Upload proof files directly to a private MinIO bucket using short-lived presigned PUT URLs generated by the backend.
- Let the host open `/bill/:billId/admin/:adminToken` to view proofs, verify payments, reject payments, and track settlement progress.

### Required services

This feature uses:

- **Supabase Postgres** for bill and payment tracking records.
- **MinIO** for private proof image/PDF object storage.
- **Node/Express API** for Supabase writes, MinIO presigned URLs, and the OpenAI receipt OCR proxy.

Browser code must not receive `SUPABASE_SERVICE_ROLE_KEY`, `MINIO_ACCESS_KEY`, or `MINIO_SECRET_KEY`. Keep those variables server-side only.

### Supabase setup

1. Create a Supabase project.
2. Run the migrations in `supabase/migrations/` in order through the Supabase SQL editor or Supabase CLI:

   - `001_payment_tracking.sql`
   - `002_enable_rls_payment_tracking.sql`

   The second migration enables Row Level Security on `public.bills` and `public.payment_proofs`, blocks direct `anon`/`authenticated` table access, and keeps server-side access available through `service_role`. This is intentional: browser code must call the Express API, not Supabase tables directly.
3. Copy your project URL and service role key into `.env`:

   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### MinIO setup

Use one public or externally reachable MinIO/S3-compatible endpoint for both API access and browser presigned URLs. Docker Compose does not start a local MinIO container.

Required MinIO variables:

```bash
MINIO_ENDPOINT=minio.example.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key
MINIO_BUCKET=split-bill-proofs
```

The Express server checks for `MINIO_BUCKET` on startup and creates it if needed. The bucket remains private; participants upload through presigned PUT URLs and admins view proofs through presigned GET URLs. Because the same MinIO endpoint is used to sign URLs, `MINIO_ENDPOINT` must be reachable from participants' browsers.

### Local development with settlement APIs

1. Copy `.env.example` to `.env` and fill in `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and the external MinIO variables.
2. Make sure the configured MinIO endpoint is reachable and allows PUT/GET requests from your app origin.
3. Start the full dev stack:

   ```bash
   npm run dev:full
   ```

   This starts:

   - Vite frontend at `http://localhost:5173`
   - Express API at `http://localhost:3000`

4. Complete the normal split flow, open the summary, and click **Save Bill & Enable Payment Tracking**.
5. Share participant links from the generated payment links panel.

### Production Docker

The Docker image now runs the Express server directly. Express serves the Vite `dist` assets and handles `/api/*` routes.

```bash
docker compose up -d --build
```

Open:

```text
http://localhost:7771
```

Make sure these variables are set before starting Docker Compose:

```bash
OPENAI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
MINIO_ENDPOINT=minio.example.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key
MINIO_BUCKET=split-bill-proofs
APP_BASE_URL=http://localhost:7771
```
