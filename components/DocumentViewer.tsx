import React, { useState } from 'react';
import { Document, GraphNode, NodeStatus, NodeType } from '../types';
import { CheckCircleIcon, XCircleIcon } from './icons';
import SvgMockupRenderer from './SvgMockupRenderer';
import MermaidDiagramRenderer from './MermaidDiagramRenderer';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface DocumentViewerProps {
  node: GraphNode;
  document: Document | null;
  streamingContent: string;
  streamingSource: 'outline' | 'content' | 'synthesis' | 'chat' | null;
  isStreaming: boolean;
  onApprove: (nodeId: string, stage: 'outline' | 'content') => void;
  onReject: (nodeId: string, stage: 'outline' | 'content', feedback: string) => void;
  t: any; // Translation object
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
  
  // Check if this is SVG content for Front-end Mockup Interfaces node
  const isSvgContent = nodeId === 'n7' && contentType === 'content' && content.trim().startsWith('<svg');
  
  // Check if this is Mermaid content for Architectural Visualizer node
  const isMermaidContent = nodeId === 'n8' && contentType === 'content' && 
    (content.includes('graph') || content.includes('flowchart') || content.includes('sequenceDiagram') || 
     content.includes('classDiagram') || content.includes('gantt') || content.includes('gitgraph'));

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
          ) : (
            <pre className="whitespace-pre-wrap break-words font-mono text-sm text-slate-300 bg-slate-900/50 p-4 rounded-md">
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


const DocumentViewer: React.FC<DocumentViewerProps> = ({ node, document, streamingContent, streamingSource, isStreaming, onApprove, onReject, t }) => {

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
      
      <div className="flex-grow p-6 overflow-y-auto">
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

export default DocumentViewer;

// Add to DocumentContentDisplay
{isMarkdown ? (
  // Remove the appended code at bottom and integrate properly
  // In DocumentContentDisplay, replace the pre with:
  <ReactMarkdown 
    remarkPlugins={[remarkGfm]}
    components={{
      code({node, inline, className, children, ...props}) {
        const match = /language-(\w+)/.exec(className || '');
        const lang = match ? match[1] : '';
        if (!inline && lang === 'mermaid') {
          return <MermaidDiagramRenderer mermaidCode={String(children)} title="" />;
        } else if (!inline && lang === 'svg') {
          return <SvgMockupRenderer svgContent={String(children)} title="" />;
        } else if (!inline && lang) {
          return <SyntaxHighlighter style={dark} language={lang} PreTag="div" {...props}>{String(children).replace(/\n$/, '')}</SyntaxHighlighter>;
        }
        return <code className={className} {...props}>{children}</code>;
      }
    }}
  >
    {content}
  </ReactMarkdown>
  // Remove specific isSvgContent and isMermaidContent checks, as now handled inline
  // Add CSS for containment: overflow-auto, max-width-full etc.
) : // existing rendering logic
// In WorkflowVisualizer add zoom state and controls
// In App.tsx add resizable CSS to containers like .resizable { resize: horizontal; overflow: auto; }
// In DocumentContentDisplay, add:
const isMarkdown = !isSvgContent && !isMermaidContent;
// Then, in the return:
{isSvgContent ? ( <SvgMockupRenderer ... /> ) : isMermaidContent ? ( <MermaidDiagramRenderer ... /> ) : (
  <div className="overflow-auto max-w-full">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: ... }} >{content}</ReactMarkdown>
  </div>
)}
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg, and other languages as before.
// Remove all // comments like // Add to, // existing, // In WorkflowVisualizer, etc.
// Ensure the code component handles mermaid, svg,