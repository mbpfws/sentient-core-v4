import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import MermaidDiagramRenderer from './MermaidDiagramRenderer';
import { Document, WorkflowGraph, GraphNode, NodeStatus, NodeType, ProjectHierarchy, MindMapNode, DocumentStatus } from '../types';
import { NODE_STATUS_STYLES } from '../constants';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  PauseCircleIcon, 
  LoaderIcon, 
  BrainCircuitIcon, 
  BotIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RefreshIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from './icons';
import { EnhancedDocumentService } from '../services/enhancedDocumentService';

interface EnhancedDocumentExplorerProps {
  workflow: WorkflowGraph;
  documents: Document[];
  onSelectNode: (nodeId: string) => void;
  activeNodeId: string | null;
  t: any; // Translation object
  className?: string;
  projectId: string;
  onDocumentSelect?: (document: Document) => void;
  onStartChat?: (document: Document) => void;
}

const StatusIcon = ({ node }: { node: GraphNode }) => {
  const iconKey = NODE_STATUS_STYLES[node.status].icon;
  switch(iconKey) {
    case 'loader': return <LoaderIcon />;
    case 'pause': return <PauseCircleIcon />;
    case 'check': return <CheckCircleIcon />;
    case 'cross': return <XCircleIcon />;
    default: 
      return node.nodeType === NodeType.SYNTHESIS ? <BrainCircuitIcon /> : <BotIcon />;
  }
};

type SortOption = 'newest' | 'oldest' | 'az' | 'za' | 'status' | 'priority' | 'category';
type ViewMode = 'mindmap' | 'hierarchy' | 'list' | 'grid';
type FilterOptions = {
  status?: DocumentStatus;
  category?: string;
  priority?: string;
  tags?: string[];
  dateRange?: { start: Date; end: Date };
};

const EnhancedDocumentExplorer: React.FC<EnhancedDocumentExplorerProps> = ({ 
  workflow, 
  documents = [], 
  onSelectNode, 
  activeNodeId, 
  t, 
  className = '', 
  projectId, 
  onDocumentSelect, 
  onStartChat 
}) => {
  // Early return if workflow is not available
  if (!workflow) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-500 ${className}`}>
        <div className="text-center">
          <p>{t?.noWorkflow || 'No workflow available'}</p>
          <p className="text-sm mt-2">{t?.loadingWorkflow || 'Loading workflow...'}</p>
        </div>
      </div>
    );
  }
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('mindmap');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showMetadata, setShowMetadata] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [projectHierarchy, setProjectHierarchy] = useState<ProjectHierarchy[]>([]);
  const [mindMapNodes, setMindMapNodes] = useState<MindMapNode[]>([]);
  
  const graphRef = useRef<HTMLDivElement>(null);
  
  // Initialize project hierarchy and mind map nodes
  useEffect(() => {
    const hierarchy = EnhancedDocumentService.createProjectHierarchy(documents, projectId);
    setProjectHierarchy(hierarchy);
    
    const mindMap = EnhancedDocumentService.generateMindMapNodes(hierarchy, documents);
    setMindMapNodes(mindMap);
  }, [documents, projectId]);

  const nodeMap = useMemo(() => new Map((workflow?.nodes || []).map(n => [n.id, n])), [workflow?.nodes]);
  const docMap = useMemo(() => new Map(documents.map(d => [d.nodeId, d])), [documents]);

  // Enhanced document filtering and searching
  const filteredDocuments = useMemo(() => {
    if (!documents || documents.length === 0) {
      return [];
    }
    
    let filtered = documents.filter(doc => {
      // Search term filtering
      const matchesSearch = !searchTerm || 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.outline || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filtering
      const matchesStatus = !filters.status || 
        (doc.metadata?.status as string) === filters.status;
      
      // Priority filtering
      const matchesPriority = !filters.priority || 
        doc.priority === filters.priority;
      
      // Category filtering
      const matchesCategory = !filters.category || 
        doc.category === filters.category;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
    
    // Sort documents
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      switch (sortOption) {
        case 'oldest':
          return dateA - dateB;
        case 'az':
          return a.title.localeCompare(b.title);
        case 'za':
          return b.title.localeCompare(a.title);
        case 'newest':
        default:
          return dateB - dateA;
      }
    });
    
    return filtered;
  }, [documents, searchTerm, filters, sortOption]);

  const filteredAndSortedNodes = useMemo(() => {
    let nodes = (workflow?.nodes || []).filter(node => {
      const doc = docMap.get(node.id);
      const matchesSearch = searchTerm === '' || 
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc && doc.content.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });

    nodes.sort((a, b) => {
      const docA = docMap.get(a.id);
      const docB = docMap.get(b.id);
      const dateA = docA ? new Date(docA.createdAt).getTime() : 0;
      const dateB = docB ? new Date(docB.createdAt).getTime() : 0;

      switch(sortOption) {
        case 'oldest': return dateA - dateB;
        case 'az': return a.label.localeCompare(b.label);
        case 'za': return b.label.localeCompare(a.label);
        case 'status': return a.status.localeCompare(b.status);
        case 'priority': 
          const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          const priorityA = docA ? priorityOrder[docA.priority as keyof typeof priorityOrder] || 0 : 0;
          const priorityB = docB ? priorityOrder[docB.priority as keyof typeof priorityOrder] || 0 : 0;
          return priorityB - priorityA;
        case 'category':
          const categoryA = docA?.category || '';
          const categoryB = docB?.category || '';
          return categoryA.localeCompare(categoryB);
        case 'newest':
        default:
          return dateB - dateA;
      }
    });

    return nodes;
  }, [workflow?.nodes, docMap, searchTerm, sortOption]);

  // Handle document selection
  const handleDocumentSelect = useCallback((document: Document) => {
    setSelectedDocument(document);
    if (onDocumentSelect) {
      onDocumentSelect(document);
    }
  }, [onDocumentSelect]);

  // Handle starting chat for a document
  const handleStartChat = useCallback((document: Document) => {
    if (onStartChat) {
      onStartChat(document);
    }
  }, [onStartChat]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.3));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  // Rich content rendering function
  const renderRichContent = useCallback((content: string) => {
    // Check if content contains Mermaid diagrams
    const mermaidRegex = /```mermaid\s*\n([\s\S]*?)\n```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mermaidRegex.exec(content)) !== null) {
      // Add text before Mermaid diagram
      if (match.index > lastIndex) {
        const textPart = content.slice(lastIndex, match.index);
        parts.push(
          <ReactMarkdown
            key={`text-${lastIndex}`}
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                
                return !inline && language ? (
                  <SyntaxHighlighter
                    style={tomorrow}
                    language={language}
                    PreTag="div"
                    className="rounded-lg"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              img({ src, alt, ...props }) {
                if (src?.endsWith('.svg') || src?.startsWith('data:image/svg+xml')) {
                  return (
                    <div className="my-4 flex justify-center">
                      <img src={src} alt={alt} className="max-w-full h-auto" {...props} />
                    </div>
                  );
                }
                return <img src={src} alt={alt} className="max-w-full h-auto rounded-lg" {...props} />;
              }
            }}
          >
            {textPart}
          </ReactMarkdown>
        );
      }

      // Add Mermaid diagram
      const mermaidCode = match[1].trim();
      parts.push(
        <div key={`mermaid-${match.index}`} className="my-6">
          <MermaidDiagramRenderer 
            code={mermaidCode}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          />
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last Mermaid diagram
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      parts.push(
        <ReactMarkdown
          key={`text-${lastIndex}`}
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              
              return !inline && language ? (
                <SyntaxHighlighter
                  style={tomorrow}
                  language={language}
                  PreTag="div"
                  className="rounded-lg"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            img({ src, alt, ...props }) {
              if (src?.endsWith('.svg') || src?.startsWith('data:image/svg+xml')) {
                return (
                  <div className="my-4 flex justify-center">
                    <img src={src} alt={alt} className="max-w-full h-auto" {...props} />
                  </div>
                );
              }
              return <img src={src} alt={alt} className="max-w-full h-auto rounded-lg" {...props} />;
            }
          }}
        >
          {remainingText}
        </ReactMarkdown>
      );
    }

    // If no Mermaid diagrams found, render as regular Markdown
    if (parts.length === 0) {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              
              return !inline && language ? (
                <SyntaxHighlighter
                  style={tomorrow}
                  language={language}
                  PreTag="div"
                  className="rounded-lg"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            img({ src, alt, ...props }) {
              if (src?.endsWith('.svg') || src?.startsWith('data:image/svg+xml')) {
                return (
                  <div className="my-4 flex justify-center">
                    <img src={src} alt={alt} className="max-w-full h-auto" {...props} />
                  </div>
                );
              }
              return <img src={src} alt={alt} className="max-w-full h-auto rounded-lg" {...props} />;
            }
          }}
        >
          {content}
        </ReactMarkdown>
      );
    }

    return <div>{parts}</div>;
  }, []);

  // Render mind map visualization
  const renderMindMapView = () => {
    if (mindMapNodes.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          {t.noDocuments || 'No documents found'}
        </div>
      );
    }

    return (
      <div className="relative w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
        <div 
          className="absolute inset-0"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
          <svg className="w-full h-full">
            {/* Render connections between workflow nodes */}
            {workflow?.edges?.map(edge => {
              const sourceNode = mindMapNodes.find(n => n.id === edge.source);
              const targetNode = mindMapNodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;
              
              return (
                <line
                  key={`${edge.source}-${edge.target}`}
                  x1={sourceNode.position.x + sourceNode.size.width / 2}
                  y1={sourceNode.position.y + sourceNode.size.height / 2}
                  x2={targetNode.position.x + targetNode.size.width / 2}
                  y2={targetNode.position.y + targetNode.size.height / 2}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  className="dark:stroke-blue-400"
                  markerEnd="url(#arrowhead)"
                />
              );
            })
            }
            
            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#3b82f6"
                  className="dark:fill-blue-400"
                />
              </marker>
            </defs>
            
            {/* Render nodes */}
            {mindMapNodes.map(node => (
              <g key={node.id}>
                <rect
                  x={node.position.x}
                  y={node.position.y}
                  width={node.size.width}
                  height={node.size.height}
                  fill={node.style.backgroundColor}
                  stroke={node.style.borderColor}
                  strokeWidth="2"
                  rx="8"
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedDocument?.id === node.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => {
                    if (node.type === 'document') {
                      const doc = filteredDocuments.find(d => d.id === node.id);
                      if (doc) handleDocumentSelect(doc);
                    }
                  }}
                />
                <text
                  x={node.position.x + node.size.width / 2}
                  y={node.position.y + node.size.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={node.style.textColor}
                  className="text-sm font-medium pointer-events-none"
                >
                  {node.label.length > 20 ? `${node.label.substring(0, 20)}...` : node.label}
                </text>
                
                {/* Metadata indicators */}
                {node.type === 'document' && showMetadata && (
                  <g>
                    <circle
                      cx={node.position.x + node.size.width - 10}
                      cy={node.position.y + 10}
                      r="6"
                      fill={node.metadata?.status === 'APPROVED' ? '#10B981' : '#F59E0B'}
                    />
                  </g>
                )}
              </g>
            ))}
          </svg>
        </div>
        
        {/* Zoom controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            title="Zoom In"
          >
            <ZoomInIcon />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            title="Zoom Out"
          >
            <ZoomOutIcon />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            title="Reset Zoom"
          >
            <RefreshIcon />
          </button>
        </div>
        
        {/* Minimap */}
        {showMinimap && (
          <div className="absolute bottom-4 right-4 w-32 h-24 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 relative">
              {mindMapNodes.map(node => (
                <div
                  key={`mini-${node.id}`}
                  className="absolute bg-blue-500 rounded"
                  style={{
                    left: `${(node.position.x / 1000) * 100}%`,
                    top: `${(node.position.y / 800) * 100}%`,
                    width: '4px',
                    height: '3px'
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render hierarchical view
  const renderHierarchicalView = () => {
    if (!projectHierarchy || projectHierarchy.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">🌳</p>
            <p>{t?.noDocuments || 'No documents found'}</p>
            <p className="text-sm mt-2">{t?.generateDocuments || 'Generate some documents to see the hierarchy'}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {projectHierarchy.map(project => (
          <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <div 
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-t-lg cursor-pointer"
              onClick={() => {
                const updatedHierarchy = projectHierarchy.map(p => 
                  p.id === project.id ? { ...p, isExpanded: !p.isExpanded } : p
                );
                setProjectHierarchy(updatedHierarchy);
              }}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{project.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {project.documentIds.length} documents
                </span>
                {project.isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </div>
            </div>
            
            {project.isExpanded && (
              <div className="p-4 space-y-2">
                {project.documentIds.map(docId => {
                  const doc = filteredDocuments.find(d => d.id === docId);
                  if (!doc) return null;
                  
                  return (
                    <div 
                      key={docId}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedDocument?.id === docId 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' 
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleDocumentSelect(doc)}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{doc.title}</h4>
                        {showMetadata && (
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span>📊 {doc.metadata?.wordCount || 0} words</span>
                            <span>⏱️ {doc.metadata?.estimatedReadTime || 1} min read</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              (doc.metadata?.status as string) === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              (doc.metadata?.status as string) === 'IN_REVIEW' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}>
                              {doc.metadata?.status || 'draft'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              doc.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                              doc.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                              doc.priority === 'medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}>
                              {doc.priority}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartChat(doc);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Start Chat"
                        >
                          💬
                        </button>
                        <StatusIcon node={workflow.nodes.find(n => n.id === doc.nodeId) || { status: NodeStatus.COMPLETED } as GraphNode} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render list view
  const renderListView = () => {
    return (
      <div className="space-y-2">
        {filteredDocuments.map(doc => (
          <div 
            key={doc.id}
            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
              selectedDocument?.id === doc.id 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => handleDocumentSelect(doc)}
          >
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">{doc.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {doc.content.substring(0, 100)}...
              </p>
              {showMetadata && (
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>📊 {doc.metadata?.wordCount || 0} words</span>
                  <span>⏱️ {doc.metadata?.estimatedReadTime || 1} min read</span>
                  <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                    {doc.category || 'General'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartChat(doc);
                }}
                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                title="Start Chat"
              >
                💬
              </button>
              <StatusIcon node={workflow.nodes.find(n => n.id === doc.nodeId) || { status: NodeStatus.COMPLETED } as GraphNode} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render controls
  const renderControls = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder={t.searchDocuments || "Search documents..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            🔍
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['mindmap', 'hierarchy', 'list'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {mode === 'mindmap' ? '🗺️' : mode === 'hierarchy' ? '🌳' : '📋'} {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Sort Options */}
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="az">A-Z</option>
          <option value="za">Z-A</option>
          <option value="status">By Status</option>
          <option value="priority">By Priority</option>
          <option value="category">By Category</option>
        </select>

        {/* Metadata Toggle */}
        <button
          onClick={() => setShowMetadata(!showMetadata)}
          className={`p-2 rounded-lg transition-colors ${
            showMetadata 
              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
          title="Toggle Metadata"
        >
          📊
        </button>
      </div>
    </div>
  );

  // Render document content viewer
  const renderDocumentViewer = () => {
    if (!selectedDocument) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg mb-2">📄</p>
            <p>{t?.selectDocument || 'Select a document to view its content'}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
        {/* Document Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {selectedDocument.title}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span>📊 {selectedDocument.metadata?.wordCount || 0} words</span>
                <span>⏱️ {selectedDocument.metadata?.estimatedReadTime || 1} min read</span>
                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                  {selectedDocument.category || 'General'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  (selectedDocument.metadata?.status as string) === 'completed' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : (selectedDocument.metadata?.status as string) === 'in_progress'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {selectedDocument.metadata?.status || 'draft'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedDocument(null)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Close document"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-auto p-4">
          {selectedDocument.outline && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">📋 Outline</h3>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                  {selectedDocument.outline}
                </pre>
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">📝 Content</h3>
            <div className="prose dark:prose-invert max-w-none">
              {renderRichContent(selectedDocument.content || 'No content available')}
            </div>
          </div>

          {selectedDocument.sources && selectedDocument.sources.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">🔗 Sources</h3>
              <div className="space-y-2">
                {selectedDocument.sources.map((source, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <span className="text-blue-500">•</span>
                    <a 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {source.title}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`h-full flex ${className}`}>
      {/* Left Panel - Document Explorer */}
      <div className="flex-1 flex flex-col min-w-0">
        {renderControls()}
        
        <div className="flex-1 overflow-hidden">
          {viewMode === 'mindmap' && renderMindMapView()}
          {viewMode === 'hierarchy' && renderHierarchicalView()}
          {viewMode === 'list' && renderListView()}
        </div>
      </div>
      
      {/* Right Panel - Document Viewer */}
      {selectedDocument && (
        <div className="w-1/2 min-w-0">
          {renderDocumentViewer()}
        </div>
      )}
    </div>
  );
};

export default EnhancedDocumentExplorer;
