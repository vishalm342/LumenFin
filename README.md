# LumenFin 

**Illuminating Financial Data with High-Speed Hybrid RAG & Grounded Intelligence**

## 📚 Quick Links

- **[Quick Start Guide](QUICK_START.md)** - Get up and running in 5 minutes
- **[MongoDB Vector Index Setup](MONGODB_VECTOR_INDEX_SETUP.md)** - Required for chat functionality
- **[Chat System Verification](CHAT_SYSTEM_VERIFICATION.md)** - End-to-end testing guide
- **[Phase 3 Implementation](PHASE_3_IMPLEMENTATION.md)** - Latest fixes and improvements
- **[Testing Guide](TESTING_GUIDE.md)** - Comprehensive testing documentation

## 🌟 Overview

LumenFin is a professional-grade Financial Intelligence Engine designed to solve the "Hallucination Problem" in AI-driven financial analysis. Traditional AI often struggles with the precision required for financial data; LumenFin solves this by implementing a Strictly Grounded RAG (Retrieval-Augmented Generation) architecture.

By combining Semantic Vector Search with Metadata Filtering, the platform allows analysts to query thousands of pages of financial reports (10-Ks, earnings calls, and research papers) with sub-second latency and auditor-level accuracy.

## 🚀 Key Features

- **Hyper-Fast Inference**: Leverages Cerebras Wafer-Scale infrastructure to deliver analysis at 2,000+ tokens per second—up to 20x faster than standard GPU-based providers.

- **Hybrid Search Architecture**: Uses MongoDB Atlas Vector Search to combine semantic meaning with strict metadata filters.

- **Auditable Citations**: Every response includes automated source citations, linking insights back to specific pages and sections within the original PDF.

- **Enterprise Security**: Secured with Clerk Authentication and middleware protection to ensure financial data remains private to the authenticated user.

## 🛠️ Technical Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, React Dropzone
- **Inference Engine**: Cerebras (Llama-3.3-70b) via Vercel AI SDK
- **Vector Database**: MongoDB Atlas Vector Search
- **Orchestration**: LangChain.js & Vercel AI SDK
- **Authentication**: Clerk (Managed Session & User Management)
- **Data Processing**: pdf-parse & RecursiveCharacterTextSplitter

## 🏗️ System Architecture

The LumenFin RAG pipeline is built for data integrity and speed:

1. **Ingestion**: PDFs are parsed and segmented into 1,000-character chunks with a 200-character overlap to preserve semantic context.
2. **Vectorization**: Chunks are converted into 768-dimension vectors using Google Gemini Embeddings and stored in MongoDB Atlas.
3. **Retrieval**: The system performs a similarity search using the `$vectorSearch` operator, filtered by user-provided metadata.
4. **Generation**: Retrieved context is passed to the Cerebras inference engine, which synthesizes the final response within milliseconds.

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas Cluster (v6.0.11 or later)
- Cerebras API Key
- Google AI API Key (for embeddings)
- Clerk Account

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/your-username/LumenFin.git
cd LumenFin
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment variables:**

Create a `.env.local` file with the following:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
CLERK_SECRET_KEY=your_secret_key_here

# MongoDB Database
MONGODB_URI=your_mongodb_connection_string_here

# Cerebras AI API
CEREBRAS_API_KEY=your_cerebras_api_key_here

# Google AI API (for embeddings)
GOOGLE_API_KEY=your_google_api_key_here
```

### MongoDB Vector Index Configuration

Navigate to **Atlas Search** and create a Vector Search Index named `vector_index` on the `financial_chunks` collection using the following JSON:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "metadata.userId"
    },
    {
      "type": "filter",
      "path": "metadata.fileName"
    }
  ]
}
```

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── api/                 # API routes
│   │   ├── chat/           # RAG Chat endpoint
│   │   └── ingest/         # PDF ingestion endpoint
│   ├── dashboard/          # Main dashboard
│   │   ├── layout.tsx      # Dashboard layout with sidebar
│   │   └── page.tsx        # Dashboard page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css
├── components/
│   └── dashboard/
│       ├── DocumentVault.tsx           # Document upload & management
│       └── FinancialAnalysisChat.tsx  # Chat interface with citations
├── lib/
│   ├── langchain.ts        # LangChain configuration
│   ├── mongodb.ts          # MongoDB connection
│   └── vectorstore.ts      # Vector search functions
├── models/
│   └── Document.ts         # Document schema
└── types/
    └── index.ts            # TypeScript types
```

## 🧪 Testing the Complete Workflow

### Step 1: Access the Landing Page

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. You should see the hero section with "LumenFin: Grounded Financial Intelligence"
3. Click **"Get Started"** button

### Step 2: Authentication

1. If not signed in, you'll be redirected to the sign-in page
2. Create a new account or sign in with an existing account
3. After authentication, you'll be redirected to `/dashboard`

### Step 3: Upload Financial Documents

1. On the dashboard, you'll see two panels:
   - **Left**: Document Vault
   - **Right**: Financial Analysis Chat

2. In the **Document Vault** panel:
   - Click **"Upload a file"** button
   - Or drag and drop a PDF file
   - Supported: Financial reports, 10-Ks, earnings transcripts

3. Watch the upload progress:
   - Status changes from "Uploading..." to "Uploaded file"
   - Green checkmark appears when complete

### Step 4: Ask Financial Questions

1. In the **Financial Analysis Chat** panel:
   - Type a question like: "What are the key risks for NVIDIA in 2024?"
   - Click the Send button (paper plane icon)

2. The AI will:
   - Retrieve relevant chunks from your uploaded documents
   - Generate a response with the "Cerebras Inference" badge
   - Include source citations like `[Source 1: NVIDIA_10K_FY2024.pdf, Page 12]`

### Step 5: View Source Citations

1. When you see a citation badge (e.g., `[Source 1, Page 12]`):
   - Click on the citation badge
   - A modal will open showing:
     - Source filename
     - Page number
     - The actual text excerpt from the document

2. Close the modal by:
   - Clicking the X button
   - Clicking outside the modal

### Step 6: Continue the Conversation

1. Ask follow-up questions
2. The chat maintains context from previous messages
3. All responses will include source citations for transparency

## 🎨 Design System

The UI follows a consistent dark theme:

- **Background**: Slate-950 to Slate-900 gradients
- **Accent Color**: Emerald-500/600 (green)
- **Text**: White and Slate-300
- **Borders**: Slate-700/800
- **Cards**: Slate-800/900 with subtle borders

## 🔐 Security Features

- **Clerk Authentication**: Secure user sessions and profile management
- **Protected Routes**: Middleware ensures only authenticated users can access the dashboard
- **User Isolation**: Documents are scoped to individual users via `userId` in metadata
- **API Protection**: All API routes verify authentication before processing

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables (Production)

Ensure all these are set in your production environment:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `MONGODB_URI`
- `CEREBRAS_API_KEY`
- `GOOGLE_API_KEY`

## 🐛 Troubleshooting

### Documents Not Uploading

- Check that MongoDB connection is working
- Verify Google AI API key is valid
- Ensure PDF is valid and not corrupted

### Chat Not Responding

- Verify Cerebras API key is set
- Check MongoDB vector index is created
- Ensure documents have been successfully ingested

### Citations Not Working

- Verify the AI response includes citation format: `[Source X: filename, Page Y]`
- Check browser console for errors

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

