import React, { useState, useEffect, useRef } from 'react';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { DownloadIcon, ZoomInIcon, ZoomOutIcon, RefreshIcon } from './icons';

interface SvgMockupRendererProps {
  svgContent: string;
  title: string;
  onError?: (error: string) => void;
  className?: string;
}

const SvgMockupRenderer: React.FC<SvgMockupRendererProps> = ({ 
  svgContent, 
  title, 
  onError,
  className = ""
}) => {
  const [zoom, setZoom] = useState(1);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedSvgs, setParsedSvgs] = useState<string[]>([]);
  const svgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse function to extract multiple SVG blocks
  const parseSvgCodes = (raw: string): string[] => {
    const regex = /```svg\s*([\s\S]*?)\s*```/g;
    const matches = [];
    let match;
    while ((match = regex.exec(raw)) !== null) {
      matches.push(match[1].trim());
    }
    return matches.length > 0 ? matches : [raw.trim()];
  };

  useEffect(() => {
    const svgs = parseSvgCodes(svgContent);
    setParsedSvgs(svgs);
    setIsValid(false);
    setError(null);
  }, [svgContent]);

  useEffect(() => {
    if (parsedSvgs.length === 0) return;

    let hasError = false;
    parsedSvgs.forEach((svg, index) => {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
          throw new Error('Invalid SVG content');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to parse SVG';
        setError(errorMsg);
        onError?.(errorMsg);
        hasError = true;
      }
    });
    setIsValid(!hasError);
  }, [parsedSvgs, onError]);

  // Update download functions for multiple
  const handleDownloadSvg = (index: number) => {
    if (!isValid || index >= parsedSvgs.length) return;
    const blob = new Blob([parsedSvgs[index]], { type: 'image/svg+xml' });
    saveAs(blob, `${title.replace(/\s+/g, '_')}_mockup_${index + 1}.svg`);
  };

  const handleDownloadPng = async (index: number) => {
    const ref = svgRefs.current[index];
    if (!ref || !isValid) return;
    try {
      const canvas = await html2canvas(ref, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      });
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `${title.replace(/\s+/g, '_')}_mockup_${index + 1}.png`);
        }
      });
    } catch (err) {
      console.error('Failed to export PNG:', err);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
  const handleResetZoom = () => setZoom(1);

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500 rounded-lg p-4 ${className}`}>
        <h4 className="text-red-400 font-semibold mb-2">SVG Rendering Error</h4>
        <p className="text-red-300 text-sm">{error}</p>
        <div className="mt-3 p-3 bg-slate-900 rounded text-xs text-slate-400 font-mono">
          {svgContent.substring(0, 200)}...
        </div>
      </div>
    );
  }

  if (!svgContent.trim()) {
    return (
      <div className={`bg-slate-800/50 border border-slate-600 rounded-lg p-8 text-center ${className}`}>
        <div className="text-slate-400 text-lg mb-2">No SVG Content</div>
        <p className="text-slate-500 text-sm">SVG mockup will appear here once generated</p>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/50">
        <h4 className="text-slate-200 font-semibold">{title}</h4>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-3">
            <button
              onClick={handleZoomOut}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
              title="Zoom Out"
            >
              <ZoomOutIcon />
            </button>
            <span className="text-xs text-slate-400 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
              title="Zoom In"
            >
              <ZoomInIcon />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors ml-1"
              title="Reset Zoom"
            >
              <RefreshIcon />
            </button>
          </div>
          <button
            onClick={handleDownloadSvg}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded flex items-center gap-1 transition-colors"
            disabled={!isValid}
          >
            <DownloadIcon /> SVG
          </button>
          <button
            onClick={handleDownloadPng}
            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded flex items-center gap-1 transition-colors"
            disabled={!isValid}
          >
            <DownloadIcon /> PNG
          </button>
        </div>
      </div>

      {/* SVG Display */}
      <div 
        ref={containerRef}
        className="overflow-auto bg-white"
        style={{ maxHeight: '600px' }}
      >
        {parsedSvgs.map((svg, index) => (
          <div 
            key={index}
            ref={(el) => (svgRefs.current[index] = el)}
            className="p-4 flex justify-center items-center min-h-[200px] border-b border-slate-700 last:border-0"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}
          >
            {isValid && (
              <div 
                dangerouslySetInnerHTML={{ __html: svg }}
                className="max-w-full"
              />
            )}
            {/* Add per-SVG download buttons */}
            <div className="absolute top-2 right-2 flex gap-2">
              <button onClick={() => handleDownloadSvg(index)} className="...">SVG</button>
              <button onClick={() => handleDownloadPng(index)} className="...">PNG</button>
            </div>
          </div>
        ))}
      </div>

      {/* Metadata */}
      <div className="p-3 border-t border-slate-700 bg-slate-800/30">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Format: SVG Vector Graphics</span>
          <span>Scalable & Editable</span>
        </div>
      </div>
    </div>
  );
};

export default SvgMockupRenderer;