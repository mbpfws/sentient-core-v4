import React, { useState } from 'react';
import { Document, GraphNode, NodeStatus, NodeType } from '../types';
import { CheckCircleIcon, XCircleIcon } from './icons';
import SvgMockupRenderer from './SvgMockupRenderer';
import MermaidDiagramRenderer from './MermaidDiagramRenderer';
import MarkdownRenderer from './MarkdownRenderer';
import ContextualChatPanel from './ContextualChatPanel';

interface DocumentViewerProps {
  node: GraphNode;
  document: Document | null;
  streamingContent: string;
  streamingSource: 'outline' | 'content' | 'synthesis' | 'chat' | null;
  isStreaming: boolean;
  onApprove: (nodeId: string, stage: 'outline' | 'content') => void;
  onReject: (nodeId: string, stage: 'outline' | 'content', feedback: string) => void;
  t: any; // Translation object
  allDocuments?: Document[]; // For contextual chat
  apiKey?: string; // For contextual chat
  onChatUpdate?: (nodeId: string, chatHistory: any[]) => void; // For contextual chat
}

const ReviewControls: React.FC<{ stage: 'outline' | 'content', nodeId: string, onApprove: DocumentViewerProps['onApprove'], onReject: DocumentViewerProps['onReject'], t: any }> = ({ stage, nodeId, onApprove, onReject, t }) => {
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
              className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md text-slate-200 focus:ring-1 focus:ring-blue-500"
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


const DocumentContentDisplay: React.FC<{ 
  title: string, 
  content: string, 
  isStreaming: boolean, 
  t: any,
  nodeId?: string,
  contentType?: 'outline' | 'content' | 'synthesis'
}> = ({ title, content, isStreaming, t, nodeId, contentType }) => {
  
  // Enhanced content type detection
  const detectContentType = (text: string) => {
    const trimmedContent = text.trim();
    
    // Check for SVG content
    if (trimmedContent.includes('<svg') && trimmedContent.includes('</svg>')) {
      return 'svg';
    }
    
    // Check for Mermaid content
    if (trimmedContent.includes('graph') || trimmedContent.includes('flowchart') || 
        trimmedContent.includes('sequenceDiagram') || trimmedContent.includes('classDiagram') || 
        trimmedContent.includes('gantt') || trimmedContent.includes('gitgraph') ||
        trimmedContent.includes('pie') || trimmedContent.includes('journey') ||
        trimmedContent.includes('erDiagram') || trimmedContent.includes('stateDiagram')) {
      return 'mermaid';
    }
    
    // Check for Markdown content (headers, lists, links, code blocks, etc.)
    if (trimmedContent.includes('#') || trimmedContent.includes('**') || 
        trimmedContent.includes('*') || trimmedContent.includes('```') ||
        trimmedContent.includes('[') || trimmedContent.includes('|') ||
        trimmedContent.includes('>') || trimmedContent.includes('-') ||
        trimmedContent.includes('1.') || trimmedContent.includes('_')) {
      return 'markdown';
    }
    
    return 'text';
  };

  const contentTypeDetected = detectContentType(content);
  
  // Enhanced content detection for ALL nodes - support rich content everywhere
  const isSvgContent = contentTypeDetected === 'svg' || 
    content.trim().startsWith('<svg') || 
    (nodeId === 'n7' && contentType === 'content'); // Front-end Mockup Interfaces
  
  const isMermaidContent = contentTypeDetected === 'mermaid' || 
    content.includes('```mermaid') || 
    (nodeId === 'n4' && contentType === 'content') || // System Architecture
    (nodeId === 'n8' && contentType === 'content'); // Architectural Visualizer
  
  const isMarkdownContent = contentTypeDetected === 'markdown' || 
    content.includes('#') || 
    content.includes('**') || 
    content.includes('```') || 
    content.includes('|') || // Tables
    content.includes('[') || // Links
    true; // Default to Markdown for ALL nodes to support rich formatting

  return (
    <div className="mb-6">
      <h4 className="text-lg font-semibold text-slate-300 mb-2">{title}</h4>
      {content || isStreaming ? (
        <>
          {isSvgContent ? (
            <SvgMockupRenderer 
              svgContent={content}
              title={title}
              className="mb-4"
            />
          ) : isMermaidContent ? (
            <MermaidDiagramRenderer 
              mermaidCode={content}
              title={title}
              className="mb-4"
            />
          ) : isMarkdownContent ? (
            <div className="bg-slate-900/50 rounded-md p-4 mb-4">
              <MarkdownRenderer 
                content={content}
                className="max-w-none"
              />
              {isStreaming && <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />}
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-words font-mono text-sm text-slate-300 bg-slate-900/50 p-4 rounded-md overflow-x-auto">
              {content}
              {isStreaming && <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />}
            </pre>
          )}
        </>
      ) : (
        <div className="text-slate-500 italic p-4 bg-slate-900/50 rounded-md">{t.notGenerated}</div>
      )}
    </div>
  );
};


const DocumentViewer: React.FC<DocumentViewerProps> = ({ node, document, streamingContent, streamingSource, isStreaming, onApprove, onReject, t, allDocuments, apiKey, onChatUpdate }) => {

  const isSynthesisNode = node.nodeType === NodeType.SYNTHESIS;
  const synthesisContent = document?.content || '';
  const outlineContent = document?.outline || '';
  const finalContent = isSynthesisNode ? '' : document?.content || '';

  const displaySynthesis = isSynthesisNode ? (synthesisContent + (isStreaming && streamingSource === 'synthesis' ? streamingContent : '')) : document?.synthesis || '';
  const displayOutline = outlineContent + (isStreaming && streamingSource === 'outline' ? streamingContent : '');
  const displayContent = finalContent + (isStreaming && streamingSource === 'content' ? streamingContent : '');

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-xl font-bold text-slate-100">{node.label}</h3>
        <p className="text-sm text-slate-400">{node.details}</p>
      </div>
      
      <div className="flex flex-grow">
        {/* Document Content Panel */}
        <div className="flex-1 p-6 overflow-y-auto border-r border-slate-700">
        {isSynthesisNode ? (
            <DocumentContentDisplay 
              title={t.synthesizedBrief} 
              content={displaySynthesis} 
              isStreaming={isStreaming && streamingSource === 'synthesis'} 
              t={t}
              nodeId={node.id}
              contentType="synthesis"
            />
        ) : (
          <>
            <DocumentContentDisplay 
              title={t.taskOutline} 
              content={displayOutline} 
              isStreaming={isStreaming && streamingSource === 'outline'} 
              t={t}
              nodeId={node.id}
              contentType="outline"
            />
            <DocumentContentDisplay 
              title={t.finalDocument} 
              content={displayContent} 
              isStreaming={isStreaming && streamingSource === 'content'} 
              t={t}
              nodeId={node.id}
              contentType="content"
            />
          </>
        )}

        {document?.sources && document.sources.length > 0 && (
          <div className="mt-4">
            <h5 className="font-semibold text-slate-400 mb-2">{t.sourcesTitle}</h5>
            <ul className="list-disc list-inside text-sm">
              {document.sources.map((source, index) => (
                <li key={index} className="mb-1">
                  <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    {source.title || source.uri}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Review Controls within Document Panel */}
        {node.status === NodeStatus.AWAITING_OUTLINE_REVIEW && (
          <div className="mt-4">
            <ReviewControls stage="outline" nodeId={node.id} onApprove={onApprove} onReject={onReject} t={t} />
          </div>
        )}
        {node.isHumanInLoop && node.status === NodeStatus.AWAITING_REVIEW && (
          <div className="mt-4">
            <ReviewControls stage="content" nodeId={node.id} onApprove={onApprove} onReject={onReject} t={t} />
          </div>
        )}
        </div>
        
        {/* Contextual Chat Panel */}
        {document && allDocuments && apiKey && (
          <div className="w-96 flex-shrink-0">
            <ContextualChatPanel
              document={document}
              allDocuments={allDocuments}
              apiKey={apiKey}
              onChatUpdate={(chatHistory) => onChatUpdate?.(node.id, chatHistory)}
              className="h-full"
              t={t}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;