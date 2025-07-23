# Sentient Core V4 - Vercel Deployment Guide

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/sentient-core-v4)

## Manual Deployment Steps

### 1. Prerequisites
- Node.js 18+ installed
- Vercel CLI installed: `npm i -g vercel`
- Google Gemini API key

### 2. Environment Variables
Set up the following environment variable in your Vercel dashboard:

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

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
2. Set the environment variable `GEMINI_API_KEY` in the Vercel dashboard
3. Deploy automatically on push to main branch

### 4. Build Configuration
The project is configured with:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node.js Version**: 18.x

### 5. Features Included
- ✅ Single Page Application (SPA) routing
- ✅ Environment variable configuration
- ✅ Optimized build with code splitting
- ✅ React 19 with TypeScript support
- ✅ Mermaid diagram rendering
- ✅ SVG mockup generation
- ✅ Multi-agent RAG system interface

### 6. Post-Deployment
After deployment, your application will be available at:
`https://your-project-name.vercel.app`

### 7. Troubleshooting
- Ensure all environment variables are set in Vercel dashboard
- Check build logs in Vercel for any deployment issues
- Verify that the Gemini API key is valid and has proper permissions