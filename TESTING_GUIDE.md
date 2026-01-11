# LumenFin - Complete Testing Guide

## Overview
This document provides step-by-step instructions to test the complete LumenFin workflow from landing page to citation preview.

---

## Prerequisites

Before testing, ensure you have:

1. **Environment Variables Configured** (`.env.local`):
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
   CLERK_SECRET_KEY=your_key
   MONGODB_URI=your_mongodb_uri
   CEREBRAS_API_KEY=your_key
   GOOGLE_API_KEY=your_key
   ```

2. **MongoDB Atlas Vector Index Created**:
   - Collection: `financial_chunks`
   - Index name: `vector_index`
   - Configuration:
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

3. **Development Server Running**:
   ```bash
   npm run dev
   ```
   Access at: http://localhost:3000

---

## Testing Workflow

### Step 1: Landing Page ✅

**What to Test:**
- Hero section displays correctly
- "LumenFin: Grounded Financial Intelligence" heading is visible
- Subtitle: "High-speed RAG analysis for complex financial documents"
- "Powered by Cerebras & MongoDB" tagline
- Dark gradient background (slate-950 to emerald-950)
- Decorative elements (sparkle, gradient circles)

**Actions:**
1. Navigate to `http://localhost:3000`
2. Verify the landing page design matches the reference image
3. Check that the "Get Started" button is prominent (emerald-500)
4. Click the "Get Started" button

**Expected Result:**
- If not authenticated: Redirected to sign-in page
- If authenticated: Redirected to `/dashboard`

---

### Step 2: Authentication 🔐

**What to Test:**
- Sign-in/Sign-up functionality
- Clerk authentication flow
- Protected route middleware

**Actions:**

**For New Users:**
1. On the sign-in page, click "Sign up"
2. Fill in email and create password
3. Complete any verification steps
4. Should automatically redirect to `/dashboard`

**For Existing Users:**
1. Enter email and password
2. Click "Sign in"
3. Should redirect to `/dashboard`

**Expected Result:**
- Successful authentication
- Automatic redirect to dashboard
- User session persists on page refresh

---

### Step 3: Dashboard Layout & Navigation 📊

**What to Test:**
- Sidebar layout
- Navigation links
- User profile button
- Overall dark theme consistency

**Actions:**
1. After signing in, verify you're on `/dashboard`
2. Check the sidebar on the left:
   - Logo at the top (📊 LumenFin)
   - Navigation items (Dashboard, Documents, Chat)
   - User profile button at the bottom (Clerk UserButton)
3. Verify main content area shows:
   - "Main dashboard" header
   - Two-panel layout (Document Vault | Financial Analysis Chat)

**Expected Result:**
- Clean split-view layout
- Sidebar navigation visible
- Both panels visible side by side (on desktop)
- Responsive on mobile (stacked panels)

---

### Step 4: Document Upload (Ingestion) 📄

**What to Test:**
- Drag & drop functionality
- File upload button
- Upload progress indicators
- PDF validation
- API integration with `/api/ingest`

**Actions:**

**Method 1: Upload Button**
1. In the "Document Vault" panel (left side)
2. Click the "Upload a file" button (emerald-600)
3. Select a PDF file from your computer
4. Observe the upload process

**Method 2: Drag & Drop**
1. If no documents exist, see the dropzone area
2. Drag a PDF file from your desktop
3. Drop it in the designated area
4. Observe the upload process

**Expected Result:**
- File appears in the document list immediately with "Uploading..." status
- Loading spinner visible during upload
- Status changes to "Uploaded file" with green checkmark when complete
- File name displayed correctly
- Multiple files can be uploaded sequentially

**Error Cases to Test:**
- Try uploading non-PDF file → Should show error: "Only PDF files are supported"
- Try uploading while offline → Should show error state

**Backend Processing:**
- PDF is parsed and split into chunks
- Embeddings are generated using Google AI
- Chunks are stored in MongoDB with user isolation (`userId`)

---

### Step 5: Financial Analysis Chat (RAG) 💬

**What to Test:**
- Chat interface functionality
- Message sending/receiving
- Streaming responses
- Cerebras inference badge
- Source citations in responses

**Actions:**

**Initial State:**
1. When no messages exist:
   - See sparkle icon
   - "Start a conversation" heading
   - Instructional text

**Sending Messages:**
1. Type a question in the input field at the bottom
   - Example: "What are the key risks for NVIDIA in 2024?"
   - Example: "What was the total revenue in Q3?"
   - Example: "Summarize the main financial highlights"
2. Click the Send button (paper plane icon) or press Enter

**During Response:**
1. Your message appears on the right (emerald-600 background)
2. Loading indicator appears (three bouncing dots)
3. AI response streams in character by character

**After Response:**
1. AI message appears on the left (slate-900 background)
2. "Cerebras Inference" badge visible (purple)
3. **Source citations** appear as clickable badges
   - Format: `[Source 1: NVIDIA_10K_FY2024.pdf, Page 12]`
   - Emerald color with border
   - Hover effect

**Expected Result:**
- Messages display in chronological order
- User messages right-aligned (green)
- AI messages left-aligned (dark with purple badge)
- Citations are clickable buttons
- Auto-scroll to latest message
- Chat history persists during session

**Backend Processing:**
- User query sent to `/api/chat`
- Vector search retrieves relevant chunks from MongoDB
- Context + query sent to Cerebras LLM
- Response streams back with citations

---

### Step 6: Source Citation Preview Modal 🔍

**What to Test:**
- Citation button click handling
- Modal appearance and design
- Source information display
- Text chunk preview
- Modal close functionality

**Actions:**

1. After receiving an AI response with citations
2. Look for citation badges like `[Source 1: filename.pdf, Page 12]`
3. Click on any citation badge

**In the Modal:**
1. Verify modal appears (center of screen)
2. Check header: "Source Citation Preview"
3. Verify content displays:
   - **Source filename**: File name clearly visible
   - **Page number**: "Page X" in top right
   - **Text preview**: The actual chunk from the document in a highlighted box

**Close the Modal:**
- Method 1: Click the X button in top right
- Method 2: Click outside the modal (on backdrop)

**Expected Result:**
- Modal opens smoothly with backdrop blur
- All citation information displays correctly
- Text is readable with proper formatting
- Modal closes cleanly
- Can open multiple citations in sequence

**Design Details:**
- Modal: slate-800 background with slate-700 border
- Text preview box: slate-900 with padding
- Backdrop: semi-transparent black with blur

---

### Step 7: End-to-End Workflow Test 🎯

**Complete User Journey:**

1. **Start Fresh**:
   - Open incognito/private browser window
   - Navigate to `http://localhost:3000`

2. **Sign Up**:
   - Click "Get Started"
   - Create new account
   - Verify email (if required by Clerk)

3. **Upload Document**:
   - Arrive at dashboard
   - Upload a financial PDF (10-K, earnings report, etc.)
   - Wait for "Uploaded" status

4. **Ask Questions**:
   - Type: "What are the main risks mentioned in this document?"
   - Send message
   - Wait for AI response with citations

5. **View Citation**:
   - Click on a citation badge
   - Read the source excerpt
   - Close modal

6. **Continue Conversation**:
   - Ask follow-up: "What about revenue growth?"
   - Verify context is maintained
   - Check for new citations

7. **Test Session Persistence**:
   - Refresh the page
   - Verify you're still logged in
   - Chat history should be cleared (new session)
   - Uploaded documents persist (in MongoDB)

---

## Common Issues & Troubleshooting

### Issue: Upload Fails
**Symptoms**: File shows "Upload failed" status
**Checks**:
- MongoDB connection working? Check MONGODB_URI
- Google AI API key valid? Check GOOGLE_API_KEY
- PDF is valid and not corrupted?
- Check browser console for errors
- Check terminal for backend errors

### Issue: Chat Not Responding
**Symptoms**: Message sends but no AI response
**Checks**:
- Cerebras API key valid? Check CEREBRAS_API_KEY
- MongoDB vector index created correctly?
- Documents uploaded successfully?
- Check `/api/chat` route logs
- Network tab shows streaming response?

### Issue: Citations Not Clickable
**Symptoms**: Citation text appears but isn't a button
**Checks**:
- Citation format correct? Should match: `[Source X: file.pdf, Page Y]`
- Check browser console for JavaScript errors
- Verify modal component is rendering

### Issue: Authentication Loop
**Symptoms**: Keeps redirecting to sign-in
**Checks**:
- Clerk keys configured correctly?
- middleware.ts file exists and configured?
- Check Clerk dashboard for issues

---

## Performance Benchmarks

**Expected Performance:**

- **Landing Page Load**: < 1 second
- **Authentication**: 1-2 seconds
- **PDF Upload (1MB)**: 2-5 seconds
- **Embedding Generation**: 3-10 seconds (depends on document size)
- **Chat Response Time**: 1-3 seconds (first token)
- **Streaming Speed**: 2000+ tokens/second (Cerebras)
- **Citation Modal**: Instant

---

## Browser Compatibility

**Tested Browsers:**
- ✅ Chrome/Edge (v120+)
- ✅ Firefox (v120+)
- ✅ Safari (v17+)

**Features Requiring Modern Browser:**
- ReadableStream API (for response streaming)
- Drag & Drop File API
- CSS backdrop-filter (for modal blur)

---

## Security Checklist

- [x] All routes protected by Clerk middleware
- [x] User isolation in database (userId in metadata)
- [x] API routes verify authentication
- [x] No API keys exposed to client
- [x] File upload restricted to PDFs only
- [x] CORS properly configured

---

## Next Steps After Testing

1. **Monitor Usage**:
   - Check MongoDB Atlas metrics
   - Monitor Cerebras API usage
   - Track Clerk MAU (monthly active users)

2. **Optimize**:
   - Add pagination to document list
   - Implement chat history persistence
   - Add document deletion functionality
   - Cache frequent queries

3. **Deploy**:
   - Push to production (Vercel recommended)
   - Set up monitoring (Sentry, LogRocket)
   - Configure production environment variables
   - Set up custom domain

---

## Support

For issues or questions:
1. Check GitHub Issues
2. Review backend logs in terminal
3. Check browser console for errors
4. Verify environment variables
5. Test with sample PDF first

---

**Happy Testing! 🚀**
