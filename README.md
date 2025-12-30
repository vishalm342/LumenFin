LumenFin 

Illuminating Financial Data with High-Speed Hybrid RAG & Grounded Intelligence

🌟 Overview

LumenFin is a professional-grade Financial Intelligence Engine designed to solve the "Hallucination Problem" in AI-driven financial analysis. Traditional AI often struggles with the precision required for financial data; LumenFin solves this by implementing a Strictly Grounded RAG (Retrieval-Augmented Generation) architecture.

By combining Semantic Vector Search with Metadata Filtering, the platform allows analysts to query thousands of pages of financial reports (10-Ks, earnings calls, and research papers) with sub-second latency and auditor-level accuracy.

🚀 Key Features
Hyper-Fast Inference: Leverages Cerebras Wafer-Scale infrastructure to deliver analysis at 2,000+ tokens per second—up to 20x faster than standard GPU-based providers.

Hybrid Search Architecture: Uses MongoDB Atlas Vector Search to combine semantic meaning with strict metadata filters (e.g., "Filter by Ticker: NVDA" + "Search: AI infrastructure investment").

Auditable Citations: Every response includes automated source citations, linking insights back to specific pages and sections within the original PDF.

Adaptive Knowledge Tiers: Tailors the complexity of financial summaries for different audiences, from simplified retail investor overviews to deep-dive institutional analysis.

Enterprise Security: Secured with Clerk Authentication and middleware protection to ensure financial data remains private to the authenticated user.

🛠️ Technical Stack

Frontend: Next.js 15 (App Router), Tailwind CSS, Lucide React.

Inference Engine: Cerebras (Llama-3.3-70b) via Vercel AI SDK.

Vector Database: MongoDB Atlas Vector Search.

Orchestration: LangChain.js & Vercel AI SDK.

Authentication: Clerk (Managed Session & User Management).

Data Processing: pdf-parse & RecursiveCharacterTextSplitter.

🏗️ System Architecture
The LumenFin RAG pipeline is built for data integrity and speed:

Ingestion: PDFs are parsed and segmented into 1,000-character chunks with a 200-character overlap to preserve semantic context.

Vectorization: Chunks are converted into 768-dimension vectors using Google Gemini Embeddings and stored in MongoDB Atlas.

Retrieval: The system performs a similarity search using the $vectorSearch operator, filtered by user-provided metadata.

Generation: Retrieved context is passed to the Cerebras inference engine, which synthesizes the final response within milliseconds.

🚦 Getting Started
Prerequisites
Node.js 18+

MongoDB Atlas Cluster (v6.0.11 or later)

Cerebras API Key

Installation
Clone the repository:

Bash

git clone https://github.com/your-username/LumenFin.git
cd LumenFin
Install dependencies:

Bash

npm install
Configure environment variables: Create a .env.local file with the following:

Code snippet

CEREBRAS_API_KEY=your_key_here
MONGODB_URI=your_atlas_connection_string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key
MongoDB Vector Index Configuration
Navigate to Atlas Search and create a Vector Search Index using the following JSON:

JSON

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
      "path": "metadata.ticker"
    }
  ]
}

📁 Project Structure
Plaintext

src/
├── app/
│   ├── api/          # Ingestion and RAG Chat routes
│   └── dashboard/    # Protected analysis interface
├── components/       # UI components (Upload, Chat, Citations)
├── lib/              # Core logic (MongoDB, LangChain, Cerebras)
├── models/           # Mongoose schemas for chunks
└── types/            # TypeScript definitions

