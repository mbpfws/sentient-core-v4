import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { 
  DownloadIcon, 
  RefreshIcon, 
  CodeIcon, 
  EyeIcon, 
  WandIcon, 
  SparklesIcon, 
  ExclamationTriangleIcon,
  ClipboardIcon,
  LoaderIcon
} from './icons';
import { GeminiService } from '../services/geminiService';

interface MermaidDiagramRendererProps {
  mermaidCode: string;
  title: string;
  onError?: (error: string) => void;
  onRegenerate?: (newCode: string) => void;
  className?: string;
  apiKey?: string;
}

interface ErrorInfo {
  message: string;
  line?: number;
  position?: number;
  expected?: string;
  got?: string;
}

const MermaidDiagramRenderer: React.FC<MermaidDiagramRendererProps> = ({
  mermaidCode,
  title,
  onError,
  onRegenerate,
  className = "",
  apiKey
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [parsedCodes, setParsedCodes] = useState<string[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationAttempts, setRegenerationAttempts] = useState(0);
  const mermaidRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse function to extract multiple Mermaid blocks
  const parseMermaidCodes = (raw: string): string[] => {
    const regex = /```mermaid\s*([\s\S]*?)\s*```/g;
    const matches = [];
    let match;
    while ((match = regex.exec(raw)) !== null) {
      matches.push(match[1].trim());
    }
    return matches.length > 0 ? matches : [raw.trim()];
  };

  // Parse error message to extract detailed information
  const parseErrorMessage = (errorMsg: string): ErrorInfo => {
    const errorInfo: ErrorInfo = { message: errorMsg };

    // Parse line number
    const lineMatch = errorMsg.match(/line (\d+)/i);
    if (lineMatch) {
      errorInfo.line = parseInt(lineMatch[1]);
    }

    // Parse position
    const positionMatch = errorMsg.match(/position (\d+)/i);
    if (positionMatch) {
      errorInfo.position = parseInt(positionMatch[1]);
    }

    // Parse expected vs got
    const expectingMatch = errorMsg.match(/Expecting '([^']+)'.*got '([^']+)'/i);
    if (expectingMatch) {
      errorInfo.expected = expectingMatch[1];
      errorInfo.got = expectingMatch[2];
    }

    return errorInfo;
  };

  // Auto-regenerate Mermaid code using AI
  const handleAutoRegenerate = async () => {
    if (!apiKey || !error || isRegenerating) return;

    setIsRegenerating(true);
    setRegenerationAttempts(prev => prev + 1);

    try {
      const geminiService = new GeminiService(apiKey);
      
      const prompt = `
You are a Mermaid diagram syntax expert. I have a Mermaid diagram that has syntax errors. Please fix the syntax errors and return ONLY the corrected Mermaid code without any explanations or markdown formatting.

**Original Mermaid Code:**
\`\`\`
${mermaidCode}
\`\`\`

**Error Details:**
- Error Message: ${error.message}
${error.line ? `- Line: ${error.line}` : ''}
${error.expected && error.got ? `- Expected: '${error.expected}', Got: '${error.got}'` : ''}

**Instructions:**
1. Fix the syntax error while preserving the diagram's intent and structure
2. Ensure all node IDs are properly formatted (no spaces, special characters handled correctly)
3. Ensure all arrows and connections use correct Mermaid syntax
4. Return ONLY the corrected Mermaid code, no explanations
5. Do not wrap the response in markdown code blocks

**Common Mermaid Syntax Rules:**
- Node IDs should not contain spaces or special characters like parentheses
- Use proper arrow syntax: --> for flowcharts, ->> for sequence diagrams
- Ensure proper indentation and line breaks
- Use quotes for labels with spaces: A["Label with spaces"]
- Subgraph syntax: subgraph title ... end

Please provide the corrected Mermaid code:`;

      let regeneratedCode = '';
      await geminiService.streamGenerator(prompt, (chunk) => {
        regeneratedCode += chunk;
      });

      // Clean up the response
      regeneratedCode = regeneratedCode.trim();
      
      // Remove any markdown code blocks if present
      regeneratedCode = regeneratedCode.replace(/```mermaid\s*/g, '').replace(/```\s*/g, '');
      
      if (regeneratedCode && onRegenerate) {
        onRegenerate(regeneratedCode);
        setError(null);
        setShowErrorDetails(false);
      }
    } catch (err) {
      console.error('Auto-regeneration failed:', err);
      setError({
        message: `Auto-regeneration failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Copy error details to clipboard
  const copyErrorToClipboard = async () => {
    if (!error) return;
    
    const errorText = `Mermaid Syntax Error:
${error.message}
${error.line ? `Line: ${error.line}` : ''}
${error.expected && error.got ? `Expected: '${error.expected}', Got: '${error.got}'` : ''}

Original Code:
${mermaidCode}`;

    try {
      await navigator.clipboard.writeText(errorText);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  useEffect(() => {
    const codes = parseMermaidCodes(mermaidCode);
    setParsedCodes(codes);
    setIsRendered(false);
    setError(null);
    setRegenerationAttempts(0);
  }, [mermaidCode]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#e2e8f0',
        primaryBorderColor: '#1e40af',
        lineColor: '#64748b',
        sectionBkgColor: '#1e293b',
        altSectionBkgColor: '#334155',
        gridColor: '#475569',
        secondaryColor: '#06b6d4',
        tertiaryColor: '#8b5cf6',
        background: '#0f172a',
        mainBkg: '#1e293b',
        secondBkg: '#334155',
        tertiaryBkg: '#475569'
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      },
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35
      },
      gantt: {
        titleTopMargin: 25,
        barHeight: 20,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 11,
        gridLineStartPadding: 35,
        bottomPadding: 25,
        leftPadding: 75,
        rightPadding: 35
      }
    });
  }, []);

  useEffect(() => {
    if (parsedCodes.length === 0) return;

    const renderDiagrams = async () => {
      setError(null);
      setIsRendered(false);

      for (let i = 0; i < parsedCodes.length; i++) {
        const ref = mermaidRefs.current[i];
        if (!ref) continue;

        try {
          ref.innerHTML = '';
          const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`;
          const { svg } = await mermaid.render(diagramId, parsedCodes[i]);
          ref.innerHTML = svg;
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to render Mermaid diagram';
          const errorInfo = parseErrorMessage(errorMsg);
          setError(errorInfo);
          onError?.(errorMsg);
          
          // Create a more user-friendly error display
          ref.innerHTML = `
            <div class="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center max-w-2xl mx-auto">
              <div class="flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                <h3 class="text-lg font-semibold text-red-300">Diagram Syntax Error</h3>
              </div>
              <p class="text-red-200 mb-4">The Mermaid diagram contains syntax errors and cannot be rendered.</p>
              <div class="text-sm text-red-300 bg-red-900/30 rounded p-3 mb-4 font-mono text-left overflow-auto">
                ${errorMsg.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              </div>
              ${apiKey ? `
                <div class="flex justify-center gap-2">
                  <button onclick="window.mermaidAutoRegenerate?.()" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                    Auto-Fix with AI
                  </button>
                </div>
              ` : ''}
            </div>
          `;
          
          // Expose auto-regenerate function globally for the button
          if (apiKey) {
            (window as any).mermaidAutoRegenerate = handleAutoRegenerate;
          }
        }
      }
      setIsRendered(true);
    };

    renderDiagrams();
  }, [parsedCodes, onError, apiKey]);

  const handleDownloadSvg = (index: number) => {
    const ref = mermaidRefs.current[index];
    if (!ref) return;
    const svgElement = ref.querySelector('svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      saveAs(blob, `${title.replace(/\s+/g, '_')}_diagram_${index + 1}.svg`);
    }
  };

  const handleDownloadPng = async (index: number) => {
    const ref = mermaidRefs.current[index];
    if (!ref) return;
    try {
      const canvas = await html2canvas(ref, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true
      });
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `${title.replace(/\s+/g, '_')}_diagram_${index + 1}.png`);
        }
      });
    } catch (err) {
      console.error('Failed to export PNG:', err);
    }
  };

  const handleRefresh = () => {
    mermaidRefs.current.forEach(ref => {
      if (ref) ref.innerHTML = '';
    });
    setIsRendered(false);
    setError(null);
    setRegenerationAttempts(0);
    // Trigger re-render
    setTimeout(() => {
      const event = new Event('mermaid-refresh');
      window.dispatchEvent(event);
    }, 100);
  };

  if (!mermaidCode.trim()) {
    return (
      <div className={`bg-slate-800/50 border border-slate-600 rounded-lg p-8 text-center ${className}`}>
        <div className="text-slate-400 text-lg mb-2">No Diagram Content</div>
        <p className="text-slate-500 text-sm">Mermaid diagram will appear here once generated</p>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <h4 className="text-slate-200 font-semibold">{title}</h4>
          {error && (
            <div className="flex items-center gap-1 text-red-400">
              <ExclamationTriangleIcon />
              <span className="text-xs">Syntax Error</span>
            </div>
          )}
          {regenerationAttempts > 0 && (
            <div className="flex items-center gap-1 text-blue-400">
              <SparklesIcon />
              <span className="text-xs">Regenerated {regenerationAttempts}x</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {error && (
            <>
              <button
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                className="px-2 py-1 text-xs rounded bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 transition-colors"
              >
                Error Details
              </button>
              <button
                onClick={copyErrorToClipboard}
                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                title="Copy Error to Clipboard"
              >
                <ClipboardIcon />
              </button>
              {apiKey && (
                <button
                  onClick={handleAutoRegenerate}
                  disabled={isRegenerating}
                  className="px-3 py-1 text-xs rounded flex items-center gap-1 transition-colors bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRegenerating ? <LoaderIcon /> : <WandIcon />}
                  {isRegenerating ? 'Fixing...' : 'Auto-Fix'}
                </button>
              )}
            </>
          )}
          
          <button
            onClick={() => setShowCode(!showCode)}
            className={`px-3 py-1 text-xs rounded flex items-center gap-1 transition-colors ${
              showCode 
                ? 'bg-purple-600 hover:bg-purple-500 text-white' 
                : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
            }`}
          >
            {showCode ? <EyeIcon /> : <CodeIcon />}
            {showCode ? 'View' : 'Code'}
          </button>
          
          <button
            onClick={handleRefresh}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh Diagram"
          >
            <RefreshIcon />
          </button>
          
          {!error && parsedCodes.map((_, index) => (
            <div key={index} className="flex gap-1">
              <button
                onClick={() => handleDownloadSvg(index)}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded flex items-center gap-1 transition-colors"
                disabled={!isRendered}
              >
                <DownloadIcon /> SVG
              </button>
              <button
                onClick={() => handleDownloadPng(index)}
                className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded flex items-center gap-1 transition-colors"
                disabled={!isRendered}
              >
                <DownloadIcon /> PNG
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Error Details Panel */}
      {error && showErrorDetails && (
        <div className="border-b border-red-500/30 bg-red-900/10 p-4">
          <h5 className="text-red-300 font-semibold mb-2">Error Analysis</h5>
          <div className="space-y-2 text-sm">
            <div className="text-red-200">
              <span className="font-medium">Message:</span> {error.message}
            </div>
            {error.line && (
              <div className="text-red-200">
                <span className="font-medium">Line:</span> {error.line}
              </div>
            )}
            {error.expected && error.got && (
              <div className="text-red-200">
                <span className="font-medium">Expected:</span> '{error.expected}' 
                <span className="mx-2">|</span>
                <span className="font-medium">Got:</span> '{error.got}'
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {showCode ? (
        <div className="p-4 bg-slate-900">
          {parsedCodes.map((code, index) => (
            <div key={index} className="mb-4">
              {parsedCodes.length > 1 && (
                <h5 className="text-slate-200 mb-2">Diagram {index + 1}</h5>
              )}
              <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap overflow-auto max-h-96 bg-slate-800/50 p-3 rounded border border-slate-600">
                {code}
              </pre>
            </div>
          ))}
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="overflow-auto bg-slate-900"
          style={{ maxHeight: '600px' }}
        >
          {parsedCodes.map((_, index) => (
            <div 
              key={index}
              ref={(el) => (mermaidRefs.current[index] = el)}
              className="p-4 flex justify-center items-center min-h-[200px] border-b border-slate-700 last:border-0"
            />
          ))}
        </div>
      )}

      {/* Metadata */}
      <div className="p-3 border-t border-slate-700 bg-slate-800/30">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Format: Mermaid Diagram</span>
          <span>
            {error ? (
              <span className="text-red-400">Error - {apiKey ? 'Auto-fix available' : 'Manual fix required'}</span>
            ) : isRendered ? (
              <span className="text-green-400">Rendered Successfully</span>
            ) : (
              <span className="text-yellow-400">Loading...</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MermaidDiagramRenderer;