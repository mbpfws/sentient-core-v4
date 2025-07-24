import React, { useState } from 'react';
import { Document, GraphNode, NodeStatus, NodeType } from '../types';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  EyeIcon, 
  CodeIcon, 
  ImageIcon,
  FileTextIcon,
  CheckCircleIcon,
  XCircleIcon
} from './icons';
import SvgMockupRenderer from './SvgMockupRenderer';
import MermaidDiagramRenderer from './MermaidDiagramRenderer';
import MarkdownRenderer from './MarkdownRenderer';
import ErrorBoundary from './ErrorBoundary';

interface EnhancedDocumentViewerProps {
  node: GraphNode;
  document: Document | null;
  streamingContent: string;
  streamingSource: 'outline' | 'content' | 'synthesis' | 'chat' | null;
  isStreaming: boolean;
  onApprove: (nodeId: string, stage: 'outline' | 'content') => void;
  onReject: (nodeId: string, stage: 'outline' | 'content', feedback: string) => void;
  t: any;
  className?: string;
}

const ReviewControls: React.FC<{ 
  stage: 'outline' | 'content', 
  nodeId: string, 
  onApprove: EnhancedDocumentViewerProps['onApprove'], 
  onReject: EnhancedDocumentViewerProps['onReject'], 
  t: any 
}> = ({ stage, nodeId, onApprove, onReject, t }) => {
  const [feedback, setFeedback] = useState('');
  const handleReject = () => {
    if (feedback.trim() && nodeId) {
      onReject(nodeId, stage, feedback);
      setFeedback('');
    }
  };

  const stageText = stage === 'outline' ? t.stageOutline : t.stageDocument;

  return (
    <div className="p-4 border-t border-slate-700 bg-slate-900/50 rounded-b-lg">
      <h4 className="font-semibold mb-2 text-yellow-300">{t.reviewTitle} {stageText}</h4>
      <p className="text-sm text-slate-400 mb-4">{t.reviewDescription.replace('{stage}', stageText)}</p>
      <div className="flex flex-col gap-2">
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={t.feedbackPlaceholder.replace('{stage}', stageText)}
          className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md text-slate-200 focus:ring-1 focus:ring-blue-500 resize-none"
          rows={2}
        />
        <div className="flex gap-4">
          <button
            onClick={() => onApprove(nodeId, stage)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md font-semibold transition-colors"
          >
            <CheckCircleIcon /> {t.approveButton.replace('{stage}', stageText)}
          </button>
          <button
            onClick={handleReject}
            disabled={!feedback.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md font-semibold transition-colors"
          >
            <XCircleIcon /> {t.rejectButton}
          </button>
        </div>
      </div>
    </div>
  );
};

const ContentSection: React.FC<{
  title: string;
  content: string;
  isStreaming: boolean;
  t: any;
  nodeId?: string;
  contentType?: 'outline' | 'content' | 'synthesis';
  defaultExpanded?: boolean;
}> = ({ title, content, isStreaming, t, nodeId, contentType, defaultExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Enhanced content type detection with strict validation
  const detectContentType = (text: string) => {
    const trimmedContent = text.trim();
    
    // SVG detection - must have both opening and closing tags
    if (trimmedContent.includes('<svg') && trimmedContent.includes('</svg>')) {
      return 'svg';
    }
    
    // Mermaid detection - must be very specific to avoid false positives
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
    
    if (startsWithMermaid || hasMermaidCodeBlock) {
      return 'mermaid';
    }
    
    // Markdown detection - be more conservative to avoid false positives
    const hasMarkdownHeaders = /^#{1,6}\s/.test(trimmedContent) || trimmedContent.includes('\n#');
    const hasMarkdownFormatting = trimmedContent.includes('**') || trimmedContent.includes('__');
    const hasMarkdownLists = /^\s*[-*+]\s/.test(trimmedContent) || /^\s*\d+\.\s/.test(trimmedContent);
    const hasMarkdownCode = trimmedContent.includes('```') && !hasMermaidCodeBlock;
    const hasMarkdownLinks = /\[.*\]\(.*\)/.test(trimmedContent);
    
    if (hasMarkdownHeaders || hasMarkdownFormatting || hasMarkdownLists || hasMarkdownCode || hasMarkdownLinks) {
      return 'markdown';
    }
    
    return 'text';
  };

  const contentTypeDetected = detectContentType(content);
  
  // Enhanced content detection for ALL 10 workflow nodes
  const isSvgContent = contentTypeDetected === 'svg' || 
    content.trim().startsWith('<svg') || 
    (nodeId === 'n7' && contentType === 'content'); // Front-end Mockup Interfaces
  
  const isMermaidContent = contentTypeDetected === 'mermaid' || 
    content.includes('```mermaid') || 
    (nodeId === 'n4' && contentType === 'content') || // System Architecture
    (nodeId === 'n8' && contentType === 'content'); // Architectural Visualizer
  
  // Enable Markdown rendering for ALL nodes to support rich formatting
  const isMarkdownContent = !isSvgContent && !isMermaidContent && (
    contentTypeDetected === 'markdown' || 
    content.includes('#') || 
    content.includes('**') || 
    content.includes('```') || 
    content.includes('|') || // Tables
    content.includes('[') || // Links
    content.includes('\n') || // Multi-line content
    true // Default to Markdown for ALL nodes to support rich formatting
  );

  const getContentIcon = () => {
    if (isSvgContent) return <ImageIcon />;
    if (isMermaidContent) return <CodeIcon />;
    if (isMarkdownContent) return <FileTextIcon />;
    return <EyeIcon />;
  };

  const getContentTypeLabel = () => {
    if (isSvgContent) return 'SVG';
    if (isMermaidContent) return 'Mermaid';
    if (isMarkdownContent) return 'Markdown';
    return 'Text';
  };

  return (
    <div className="mb-4 border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {getContentIcon()}
          <div className="text-left">
            <h4 className="text-lg font-semibold text-slate-200">{title}</h4>
            <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
              {getContentTypeLabel()}
            </span>
          </div>
        </div>
        {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </button>
      
      {isExpanded && (
        <div className="p-4 border-t border-slate-700">
          {content || isStreaming ? (
            <>
              {isSvgContent ? (
                <ErrorBoundary fallback={<div className="text-red-400 p-4">Failed to render SVG content</div>}>
                  <SvgMockupRenderer 
                    svgContent={content}
                    title={title}
                    className="mb-4"
                  />
                </ErrorBoundary>
              ) : isMermaidContent ? (
                <ErrorBoundary fallback={<div className="text-red-400 p-4">Failed to render Mermaid diagram</div>}>
                  <MermaidDiagramRenderer 
                    mermaidCode={content}
                    title={title}
                    className="mb-4"
                  />
                </ErrorBoundary>
              ) : isMarkdownContent ? (
                <ErrorBoundary fallback={<div className="text-red-400 p-4">Failed to render Markdown content</div>}>
                  <div className="bg-slate-900/50 rounded-md p-4">
                    <MarkdownRenderer 
                      content={content}
                      className="max-w-none"
                    />
                    {isStreaming && <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />}
                  </div>
                </ErrorBoundary>
              ) : (
                <pre className="whitespace-pre-wrap break-words font-mono text-sm text-slate-300 bg-slate-900/50 p-4 rounded-md overflow-x-auto max-h-96 overflow-y-auto">
                  {content}
                  {isStreaming && <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />}
                </pre>
              )}
            </>
          ) : (
            <div className="text-slate-500 italic p-4 bg-slate-900/50 rounded-md">{t.notGenerated}</div>
          )}
        </div>
      )}
    </div>
  );
};

const EnhancedDocumentViewer: React.FC<EnhancedDocumentViewerProps> = ({ 
  node, 
  document, 
  streamingContent, 
  streamingSource, 
  isStreaming, 
  onApprove, 
  onReject, 
  t,
  className = ''
}) => {
  // Add safety checks
  if (!node) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="p-4 text-center text-slate-400">
          <p>No document selected</p>
        </div>
      </div>
    );
  }

  if (!t) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="p-4 text-center text-slate-400">
          <p>Loading translations...</p>
        </div>
      </div>
    );
  }

  const isSynthesisNode = node.nodeType === NodeType.SYNTHESIS;
  const synthesisContent = document?.content || '';
  const outlineContent = document?.outline || '';
  const finalContent = isSynthesisNode ? '' : document?.content || '';

  const displaySynthesis = isSynthesisNode ? (synthesisContent + (isStreaming && streamingSource === 'synthesis' ? streamingContent : '')) : document?.synthesis || '';
  const displayOutline = outlineContent + (isStreaming && streamingSource === 'outline' ? streamingContent : '');
  const displayContent = finalContent + (isStreaming && streamingSource === 'content' ? streamingContent : '');

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="p-4 border-b border-slate-700 bg-slate-800/30">
        <h3 className="text-xl font-bold text-slate-100 mb-1">{node.label}</h3>
        <p className="text-sm text-slate-400">{node.details}</p>
      </div>
      
      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {isSynthesisNode ? (
          <ContentSection
            title={t.synthesizedBrief}
            content={displaySynthesis}
            isStreaming={isStreaming && streamingSource === 'synthesis'}
            t={t}
            nodeId={node.id}
            contentType="synthesis"
            defaultExpanded={true}
          />
        ) : (
          <>
            <ContentSection
              title={t.taskOutline}
              content={displayOutline}
              isStreaming={isStreaming && streamingSource === 'outline'}
              t={t}
              nodeId={node.id}
              contentType="outline"
              defaultExpanded={false}
            />
            <ContentSection
              title={t.finalDocument}
              content={displayContent}
              isStreaming={isStreaming && streamingSource === 'content'}
              t={t}
              nodeId={node.id}
              contentType="content"
              defaultExpanded={true}
            />
          </>
        )}

        {document?.sources && document.sources.length > 0 && (
          <div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30">
            <h5 className="font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <FileTextIcon />
              {t.sourcesTitle} ({document.sources.length})
            </h5>
            <div className="space-y-2">
              {document.sources.map((source, index) => (
                <div key={index} className="p-2 bg-slate-900/50 rounded border border-slate-600">
                  <a 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-400 hover:text-blue-300 hover:underline transition-colors text-sm font-medium"
                  >
                    {source.title || source.uri}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {node.status === NodeStatus.AWAITING_OUTLINE_REVIEW && (
        <ReviewControls stage="outline" nodeId={node.id} onApprove={onApprove} onReject={onReject} t={t} />
      )}
      {node.isHumanInLoop && node.status === NodeStatus.AWAITING_REVIEW && (
        <ReviewControls stage="content" nodeId={node.id} onApprove={onApprove} onReject={onReject} t={t} />
      )}
    </div>
  );
};

export default EnhancedDocumentViewer;