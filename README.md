# Sentient Core V4

A modern React application built with Vite, featuring AI-powered document management and workflow visualization.

## Features

- 🤖 AI-powered chat interface with Gemini API
- 📄 Document management and exploration
- 🔄 Workflow visualization with Mermaid diagrams
- 🎨 SVG mockup rendering
- 🌐 Multi-language support
- 🔒 Client-side API key management

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **AI**: Google Gemini API
- **Styling**: Tailwind CSS
- **Diagrams**: Mermaid
- **File Handling**: JSZip, File-saver, HTML2Canvas

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API key

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd sentient-core-v4
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### API Key Setup

The application uses client-side API key management for security:

1. When you first open the app, you'll be prompted to enter your Gemini API key
2. Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
3. The key is stored locally in your browser and never sent to any server

## Deployment

### Vercel Deployment

This project is optimized for Vercel deployment:

1. **Connect to Vercel**:
   - Push your code to GitHub/GitLab/Bitbucket
   - Import the project in Vercel dashboard
   - Vercel will automatically detect the Vite framework

2. **Build Configuration**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Framework: Vite (auto-detected)

3. **Environment Variables**:
   - No server-side environment variables needed
   - API keys are handled client-side

4. **Deploy**:
   ```bash
   # Using Vercel CLI
   npm i -g vercel
   vercel --prod
   ```

### Manual Build

```bash
# Build for production
npm run build

# Preview the build locally
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ApiKeyModal.tsx  # API key management
│   ├── ChatPanel.tsx    # AI chat interface
│   ├── DocumentManager.tsx # Document handling
│   └── ...
├── services/           # API services
│   └── geminiService.ts # Gemini AI integration
├── hooks/              # Custom React hooks
│   └── useLocalStorage.ts
├── types.ts            # TypeScript definitions
├── constants.ts        # App constants
└── locales.ts          # Internationalization

```

## Configuration Files

- `vite.config.ts` - Vite build configuration
- `vercel.json` - Vercel deployment settings
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts

## Security

- ✅ Client-side API key management
- ✅ No server-side secrets
- ✅ Secure build process
- ✅ No API keys in environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
