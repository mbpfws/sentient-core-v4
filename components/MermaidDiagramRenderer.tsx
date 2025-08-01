import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { DownloadIcon, RefreshIcon, CodeIcon, EyeIcon } from './icons';
import { IntelligentErrorCorrectionService } from '../services/intelligentErrorCorrection';

interface MermaidDiagramRendererProps {
  mermaidCode: string;
  title: string;
  onError?: (error: string) => void;
  className?: string;
}

const MermaidDiagramRenderer: React.FC<MermaidDiagramRendererProps> = ({
  mermaidCode,
  title,
  onError,
  className = ""
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [parsedCodes, setParsedCodes] = useState<string[]>([]);
  const mermaidRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Validate if content is actually Mermaid
  const isValidMermaidContent = (content: string): boolean => {
    const trimmedContent = content.trim();
    
    // Check for Mermaid keywords
    const mermaidKeywords = [
      'graph TD', 'graph LR', 'graph TB', 'graph RL',
      'flowchart TD', 'flowchart LR', 'flowchart TB', 'flowchart RL',
      'sequenceDiagram', 'classDiagram', 'stateDiagram',
      'erDiagram', 'journey', 'gantt', 'pie title', 'gitgraph'
    ];
    
    // Check if content starts with mermaid keywords or is wrapped in mermaid code blocks
    const startsWithMermaid = mermaidKeywords.some(keyword => 
      trimmedContent.startsWith(keyword) || 
      trimmedContent.startsWith('```mermaid\n' + keyword) ||
      trimmedContent.includes('```mermaid\n' + keyword)
    );
    
    // Additional check for mermaid code blocks
    const hasMermaidCodeBlock = trimmedContent.includes('```mermaid') && trimmedContent.includes('```');
    
    return startsWithMermaid || hasMermaidCodeBlock;
  };

  // Parse function to extract multiple Mermaid blocks
  const parseMermaidCodes = (raw: string): string[] => {
    // First validate if this is actually Mermaid content
    if (!isValidMermaidContent(raw)) {
      return [];
    }
    
    const regex = /```mermaid\s*([\s\S]*?)\s*```/g;
    const matches = [];
    let match;
    while ((match = regex.exec(raw)) !== null) {
      matches.push(match[1].trim());
    }
    return matches.length > 0 ? matches : [raw.trim()];
  };

  useEffect(() => {
    const codes = parseMermaidCodes(mermaidCode);
    setParsedCodes(codes);
    setIsRendered(false);
    setError(null);
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
        fontSize: 11,
        gridLineStartPadding: 35
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
          
          // Apply intelligent error correction
          const correctionService = IntelligentErrorCorrectionService.getInstance();
          const correctionResult = correctionService.correctMermaidSyntax(
            errorMsg,
            parsedCodes[i],
            title
          );
          
          // Try to render the corrected code
          try {
            const correctedDiagramId = `mermaid-corrected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`;
            const { svg } = await mermaid.render(correctedDiagramId, correctionResult.correctedContent);
            ref.innerHTML = `
              <div class="border border-yellow-500/30 rounded-lg p-3 mb-2 bg-yellow-500/10">
                <div class="text-yellow-400 text-xs font-medium mb-1">Auto-corrected diagram</div>
                <div class="text-yellow-300 text-xs">${correctionResult.corrections.join(', ')}</div>
              </div>
              ${svg}
            `;
          } catch (correctionErr) {
            // If correction also fails, show contained error message
            setError(errorMsg);
            onError?.(errorMsg);
            ref.innerHTML = `
              <div class="bg-slate-800/50 border border-red-500/30 rounded-lg p-4 text-center max-w-full overflow-hidden">
                <div class="text-red-400 font-semibold mb-2">Diagram Rendering Error</div>
                <div class="text-red-300 text-sm mb-3">${errorMsg}</div>
                <div class="text-slate-400 text-xs">Auto-correction attempted but failed</div>
                <button 
                  onclick="this.parentElement.style.display='none'" 
                  class="mt-2 px-3 py-1 bg-red-600/20 text-red-300 rounded text-xs hover:bg-red-600/30 transition-colors"
                  ref={(el) => {
                    if (el) {
                      containerRef.current = el;
                    }
                  }}
                >
                  Dismiss
                </button>
              </div>
            `;
          }
        }
      }
      setIsRendered(true);
    };

    renderDiagrams();
  }, [parsedCodes, onError]);

  // Modify download functions to handle multiple diagrams if needed
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
    // Clear all diagram refs and reset state
    mermaidRefs.current.forEach(ref => {
      if (ref) {
        ref.innerHTML = '';
      }
    });
    setIsRendered(false);
    setError(null);
    // Trigger re-render by updating parsedCodes
    const codes = parseMermaidCodes(mermaidCode);
    setParsedCodes([...codes]);
  };

  if (!mermaidCode.trim()) {
    return (
      <div className={`bg-slate-800/50 border border-slate-600 rounded-lg p-8 text-center ${className}`}>
        <div className="text-slate-400 text-lg mb-2">No Diagram Content</div>
        <p className="text-slate-500 text-sm">Mermaid diagram will appear here once generated</p>
      </div>
    );
  }

  // Check if content is valid Mermaid before rendering
  if (!isValidMermaidContent(mermaidCode)) {
    return (
      <div className={`bg-slate-800/50 border border-slate-600 rounded-lg p-8 text-center ${className}`}>
        <div className="text-yellow-400 text-lg mb-2">Invalid Mermaid Content</div>
        <p className="text-slate-500 text-sm">This content does not appear to be a valid Mermaid diagram</p>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/50">
        <h4 className="text-slate-200 font-semibold">{title}</h4>
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => handleDownloadSvg(0)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded flex items-center gap-1 transition-colors"
            disabled={!isRendered}
          >
            <DownloadIcon /> SVG
          </button>
          <button
            onClick={() => handleDownloadPng(0)}
            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded flex items-center gap-1 transition-colors"
            disabled={!isRendered}
          >
            <DownloadIcon /> PNG
          </button>
        </div>
      </div>

      {/* Content */}
      {showCode ? (
        <div className="p-4 bg-slate-900">
          {parsedCodes.map((code, index) => (
            <div key={index} className="mb-4">
              <h5 className="text-slate-200">Diagram {index + 1}</h5>
              <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap overflow-auto max-h-96">
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
            >
            </div>
          ))}
        </div>
      )}

      {/* Metadata */}
      <div className="p-3 border-t border-slate-700 bg-slate-800/30">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Format: Mermaid Diagram</span>
          <span>{error ? 'Error' : isRendered ? 'Rendered' : 'Loading...'}</span>
        </div>
      </div>
    </div>
  );
};

export default MermaidDiagramRenderer;