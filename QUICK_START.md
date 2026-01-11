# LumenFin - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd LumenFin
npm install
```

### 2. Set Up Environment Variables

Create `.env.local` in the root directory:

```env
# Clerk Authentication (Get from https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# MongoDB Atlas (Get from https://mongodb.com/atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lumenfin

# Cerebras API (Get from https://cerebras.ai)
CEREBRAS_API_KEY=csk-...

# Google AI API (Get from https://makersuite.google.com/app/apikey)
GOOGLE_API_KEY=AIza...
```

### 3. Set Up MongoDB Atlas Vector Index

1. Log into MongoDB Atlas
2. Navigate to your cluster → Collections
3. Create database: `lumenfin`
4. Create collection: `financial_chunks`
5. Go to "Search Indexes" → "Create Index"
6. Choose "JSON Editor" and paste:

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

7. Name it `vector_index` and create

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Test the Application

1. **Sign Up**: Click "Get Started" and create an account
2. **Upload a PDF**: In the Document Vault, upload a financial document
3. **Ask Questions**: Type a question about your document
4. **View Citations**: Click on citation badges to see source text

---

## 📋 Quick Reference

### File Structure
```
src/
├── app/
│   ├── (auth)/              # Sign-in/Sign-up pages
│   ├── api/
│   │   ├── chat/           # RAG chat endpoint
│   │   └── ingest/         # PDF upload endpoint
│   ├── dashboard/          # Main dashboard
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/
│   └── dashboard/
│       ├── DocumentVault.tsx           # Upload UI
│       └── FinancialAnalysisChat.tsx   # Chat UI
└── lib/                    # Backend utilities
```

### Key Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### API Endpoints

- `POST /api/ingest` - Upload and process PDF
- `POST /api/chat` - Chat with documents (streaming)

### Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Auth**: Clerk
- **Database**: MongoDB Atlas (Vector Search)
- **AI**: Cerebras (LLM) + Google AI (Embeddings)
- **Deployment**: Vercel (recommended)

---

## 🎨 UI Components

### Landing Page
- Hero section with gradient background
- CTA button linking to dashboard
- Responsive design

### Dashboard Layout
- Sidebar navigation
- Two-panel split view
- User profile button

### Document Vault
- Drag & drop upload
- Document list with status
- Upload progress indicators

### Chat Interface
- Message history
- Streaming responses
- Clickable citations
- Citation preview modal

---

## 🔧 Configuration

### Clerk Setup
1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Copy API keys to `.env.local`
4. Configure allowed redirect URLs

### MongoDB Setup
1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create database user
3. Whitelist IP (0.0.0.0/0 for development)
4. Get connection string
5. Create vector index (see step 3 above)

### Cerebras API
1. Sign up at [cerebras.ai](https://cerebras.ai)
2. Generate API key
3. Add to `.env.local`

### Google AI API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to `.env.local`

---

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

### MongoDB Connection Issues
- Check connection string format
- Verify IP whitelist includes your IP
- Ensure database user has read/write permissions

### Clerk Authentication Issues
- Verify API keys in `.env.local`
- Check middleware.ts is present
- Clear browser cookies and try again

### PDF Upload Fails
- Ensure MongoDB is connected
- Check Google AI API key is valid
- Verify PDF is valid (try smaller file first)

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [MongoDB Atlas Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/)
- [Cerebras AI](https://cerebras.ai/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

---

## 🚢 Deploy to Production

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

```bash
# Or use Vercel CLI
npm i -g vercel
vercel
```

### Other Platforms
- **Netlify**: Add build command `npm run build` and output directory `.next`
- **Railway**: Connect GitHub and add environment variables
- **Docker**: Use included Dockerfile

---

## 📞 Support

- GitHub Issues: [your-repo/issues](https://github.com/your-repo/issues)
- Documentation: See `README.md` and `TESTING_GUIDE.md`
- Email: your-email@example.com

---

**Built with ❤️ using Next.js, Cerebras, and MongoDB**
