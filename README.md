# Say & Save

> **Voice-First Order Notebook, Flashcards & Ledger for Small Businesses**  
> Convert regional spoken customer notes into clean English orders, physical flashcards, and automated balances in 3 seconds.

Say & Save transforms spoken voice notes into clean, structured customer orders with zero manual typing. Built with a modular shadcn dashboard specifically tailored for single-owner operations—including tailors, pharmacies, bakeries, electronics repair shops, and laundry services.

---

## Key Capabilities

1. **Voice-First Recording & Automatic English Conversion**:
   - Speak naturally in Hindi, Hinglish, or English (e.g., *"Verma Uncle 3-piece suit stitching, deliver by Friday, total 1200, advance 500"*).
   - Audio is converted into clean English fields with automated due-date and financial calculation in under 4 seconds.
2. **Dedicated Single-Responsibility Workspace Sections**:
   - **Overview**: High-level store metrics, receivable trends, and urgent deliveries.
   - **Voice Recorder Studio**: Clean recording studio with live microphone capture, audio file upload, and sample note testing.
   - **Order Flashcards & Slips**: Trade-specific physical slip specifications, measurement memory, inline editing, and instant owner notifications.
   - **Pending Bills & Receivables**: Tracks unpaid balances, accounts recovery, and settlement logging.
   - **Master Ledger**: Filterable, sortable data table for all store orders.
3. **Owner-Targeted Notifications**:
   - **Resend Email Delivery**: Rich HTML order slips and pending receivable summaries sent directly to the shopkeeper's registered email.
   - **TextBee SMS Alerts**: Automated deadline SMS notifications dispatched through the owner's linked Android gateway.
4. **Tailored Trade Packs**:
   - **Tailor & Boutique**: Chest, waist, shoulder, length, and customer measurement records.
   - **Medical Store & Pharmacy**: Batch numbers, expiry tracking, prescription logs, and 30-day expiry alerts.
   - **Bakery & Confectionery**: Cake weights, flavours, custom messages, and event times.
   - **Electronics & Repair**: Device brand, model, fault descriptions, and estimate quotes.
   - **Laundry & Dry Cleaners**: Garment counts, wash/iron services, and collection dates.
5. **Speed-First Hybrid Intelligence**:
   - **Local Mode**: Runs private `gemma4:e2b` via Ollama for 100% offline security.
   - **Cloud Mode**: Uses Google Gemini 3.5 Flash Lite for sub-4s high-speed extraction.
   - **Deterministic Python Verification Gate**: The AI model only extracts entities; all mathematical calculations (`balance_due = amount - advance`) and calendar dates are computed strictly in Python.
6. **Accessibility & Localization**:
   - Complete Dark Mode / Light Mode support with persistent state.
   - Instant English / Hindi language toggle across all navigation, cards, and modal components.
   - Locked occupation safeguards to prevent accidental ledger field mismatches.

---

## Local Development

### Prerequisites
- Python 3.12+
- Node.js 18+
- (Optional for offline mode) Ollama with `gemma4:e2b`

### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/Daks9h/Say-and-Save.git
cd Say-and-Save

# Install Python dependencies
pip install -r requirements.txt

# Create .env from template and add your API keys
cp .env.example .env

# Start FastAPI backend
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup
```bash
# In a new terminal, navigate to the frontend folder
cd frontend

# Install Node dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploying on Vercel

To deploy the **Say & Save** frontend on Vercel:

1. Push your repository to GitHub: `https://github.com/Daks9h/Say-and-Save`
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **Add New Project** &rarr; **Import** your repository.
3. Configure the Project Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click `Edit` and select `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
4. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed backend (e.g., hosted on Render, Railway, or Google Cloud Run). If testing locally or via tunnel, specify your public endpoint.
5. Click **Deploy**. Vercel will build and deploy the Next.js frontend to a global edge CDN.

---

## Testing

Run the automated test suite covering deterministic calculations, audio pipelines, and API routes:
```bash
pytest tests/
```
*(All 23 unit and integration tests pass).*
