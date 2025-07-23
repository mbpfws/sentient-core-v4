# Sentient Core V4 - Vercel Deployment Guide

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/sentient-core-v4)

## Manual Deployment Steps

### 1. Prerequisites
- Node.js 18+ installed
- Vercel CLI installed: `npm i -g vercel`

### 2. Client-Side API Key Configuration
**Important**: This application uses **client-side API keys only**. Users provide their own Google Gemini API keys through the application interface.

- **No server-side environment variables needed**
- **No API keys stored on the server**
- **Users enter their own API keys in the browser**
- **API keys are stored locally in browser localStorage**

### 3. Deploy Commands

#### Option A: Using Vercel CLI
```bash
# Install dependencies
npm install

# Login to Vercel (if not already logged in)
vercel login

# Deploy to Vercel
vercel --prod
```

#### Option B: Using Vercel Dashboard
1. Connect your GitHub repository to Vercel
2. **No environment variables needed** - the app handles API keys client-side
3. Deploy automatically on push to main branch

### 4. Build Configuration
The project is configured with:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node.js Version**: 18.x
- **Client-Side Only**: No server-side API calls

### 5. Features Included
- ✅ Single Page Application (SPA) routing
- ✅ Client-side API key management
- ✅ Optimized build with code splitting
- ✅ React 19 with TypeScript support
- ✅ Mermaid diagram rendering
- ✅ SVG mockup generation
- ✅ Multi-agent RAG system interface
- ✅ Secure local storage for API keys

### 6. Post-Deployment
After deployment, your application will be available at:
`https://your-project-name.vercel.app`

**First-time users will be prompted to enter their Google Gemini API key**, which will be stored locally in their browser.

### 7. Security Features
- ✅ No API keys stored on server
- ✅ Client-side only API key handling
- ✅ Local browser storage for user keys
- ✅ No server-side environment variables needed
- ✅ Each user provides their own API key

### 8. Troubleshooting
- If users can't access AI features, they need to provide a valid Gemini API key
- API keys are stored locally - clearing browser data will require re-entering the key
- No server-side configuration needed for API access