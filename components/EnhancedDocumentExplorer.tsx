import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Document, WorkflowGraph, GraphNode, NodeStatus, NodeType } from '../types';
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
  MaximizeIcon,
  ShrinkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ToggleLeftIcon,
  ToggleRightIcon
} from './icons';
import { ResizableLayout } from './ResizableLayout';

interface EnhancedDocumentExplorerProps {
  workflow: WorkflowGraph;
  documents: Document[];
  onSelectNode: (nodeId: string) => void;
  activeNodeId: string | null;
  t: any; // Translation object
  className?: string;
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

type SortOption = 'newest' | 'oldest' | 'az' | 'za' | 'status';
type ViewMode = 'graph' | 'list' | 'grid';

const EnhancedDocumentExplorer: React.FC<EnhancedDocumentExplorerProps> = ({ 
  workflow, 
  documents, 
  onSelectNode, 
  activeNodeId, 
  t,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<NodeStatus | 'ALL'>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showMinimap, setShowMinimap] = useState(true);
  const [autoLayout, setAutoLayout] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  
  const graphRef = useRef<HTMLDivElement>(null);
  
  const nodeMap = useMemo(() => new Map(workflow.nodes.map(n => [n.id, n])), [workflow.nodes]);
  const docMap = useMemo(() => new Map(documents.map(d => [d.nodeId, d])), [documents]);

  const filteredAndSortedNodes = useMemo(() => {
    let nodes = workflow.nodes.filter(node => {
      const doc = docMap.get(node.id);
      const matchesSearch = searchTerm === '' || 
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc && doc.content.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'ALL' || node.status === statusFilter;

      return matchesSearch && matchesStatus;
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
        case 'newest':
        default:
          return dateB - dateA;
      }
    });

    return nodes;
  }, [workflow.nodes, docMap, searchTerm, statusFilter, sortOption]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.3));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const handleFitToView = useCallback(() => {
    if (graphRef.current && workflow.nodes.length > 0) {
      const container = graphRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // Calculate bounds of all nodes
      const bounds = workflow.nodes.reduce((acc, node) => ({
        minX: Math.min(acc.minX, node.position.x),
        maxX: Math.max(acc.maxX, node.position.x + 200),
        minY: Math.min(acc.minY, node.position.y),
        maxY: Math.max(acc.maxY, node.position.y + 80)
      }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
      
      const graphWidth = bounds.maxX - bounds.minX;
      const graphHeight = bounds.maxY - bounds.minY;
      
      const scaleX = containerRect.width / graphWidth;
      const scaleY = containerRect.height / graphHeight;
      const scale = Math.min(scaleX, scaleY, 2) * 0.9; // 90% to add some padding
      
      setZoomLevel(scale);
    }
  }, [workflow.nodes]);

  const renderGraphView = () => (
    <div className="relative w-full h-full overflow-hidden bg-slate-900/30 rounded-lg">
      {/* Graph Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 border border-slate-600">
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomIn}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomInIcon />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOutIcon />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Reset Zoom"
            >
              <RefreshIcon />
            </button>
            <button
              onClick={handleFitToView}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Fit to View"
            >
              <MaximizeIcon />
            </button>
          </div>
          <div className="text-xs text-slate-400 text-center mt-1">
            {Math.round(zoomLevel * 100)}%
          </div>
        </div>
        
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 border border-slate-600">
          <button
            onClick={() => setShowMinimap(!showMinimap)}
            className={`p-1 rounded transition-colors ${
              showMinimap ? 'text-blue-400 bg-blue-900/30' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="Toggle Minimap"
          >
            <ShrinkIcon />
          </button>
        </div>
      </div>

      {/* Graph Container */}
      <div 
        ref={graphRef}
        className="w-full h-full overflow-auto"
        style={{ 
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left'
        }}
      >
        <div className="relative" style={{ 
          width: Math.max(1200, workflow.nodes.length * 250), 
          height: Math.max(800, workflow.nodes.length * 120) 
        }}>
          {/* Render Edges */}
          <svg className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            {workflow.edges.map(edge => {
              const sourceNode = nodeMap.get(edge.source);
              const targetNode = nodeMap.get(edge.target);
              if (!sourceNode || !targetNode) return null;

              const isCompleted = sourceNode.status === NodeStatus.COMPLETED;
              const strokeColor = isCompleted ? '#22c55e' : '#475569';
              
              return (
                <g key={edge.id}>
                  <line
                    x1={sourceNode.position.x + 180}
                    y1={sourceNode.position.y + 40}
                    x2={targetNode.position.x}
                    y2={targetNode.position.y + 40}
                    stroke={strokeColor}
                    strokeWidth="2"
                    className="transition-all duration-500"
                    opacity={0.7}
                  />
                  <circle
                    cx={targetNode.position.x}
                    cy={targetNode.position.y + 40}
                    r="3"
                    fill={strokeColor}
                  />
                </g>
              );
            })}
          </svg>
          
          {/* Render Nodes */}
          {workflow.nodes.map(node => {
            const styles = NODE_STATUS_STYLES[node.status];
            const isActive = node.id === activeNodeId;
            const isVisible = filteredAndSortedNodes.some(n => n.id === node.id);
            const doc = docMap.get(node.id);

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node.id)}
                className={`absolute p-3 rounded-lg border-2 w-52 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-blue-500/30 ${styles.bg} ${styles.border} ${
                  isActive ? 'ring-2 ring-blue-400 scale-105' : ''
                } ${isVisible ? 'opacity-100' : 'opacity-30'}`}
                style={{ 
                  top: node.position.y, 
                  left: node.position.x,
                  transform: isActive ? 'scale(1.05)' : 'scale(1)'
                }}
                title={node.details}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`${styles.text}`}>
                    <StatusIcon node={node} />
                  </div>
                  <h4 className={`font-bold text-sm ${styles.text} truncate flex-1`}>
                    {node.label}
                  </h4>
                </div>
                
                <div className="text-xs text-slate-400 mb-1">
                  {node.nodeType} • {node.status}
                </div>
                
                {doc && (
                  <div className="text-xs text-slate-500 truncate">
                    {doc.content.length > 50 ? `${doc.content.substring(0, 50)}...` : doc.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Minimap */}
      {showMinimap && (
        <div className="absolute bottom-4 right-4 w-48 h-32 bg-slate-800/90 backdrop-blur-sm border border-slate-600 rounded-lg p-2">
          <div className="text-xs text-slate-400 mb-1">Minimap</div>
          <div className="relative w-full h-full bg-slate-900/50 rounded overflow-hidden">
            {workflow.nodes.map(node => {
              const isActive = node.id === activeNodeId;
              const isVisible = filteredAndSortedNodes.some(n => n.id === node.id);
              
              return (
                <div
                  key={node.id}
                  className={`absolute w-2 h-2 rounded-sm transition-all ${
                    isActive ? 'bg-blue-400' : isVisible ? 'bg-slate-400' : 'bg-slate-600'
                  }`}
                  style={{
                    left: `${(node.position.x / 1200) * 100}%`,
                    top: `${(node.position.y / 800) * 100}%`
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {filteredAndSortedNodes.map(node => {
        const styles = NODE_STATUS_STYLES[node.status];
        const isActive = node.id === activeNodeId;
        const doc = docMap.get(node.id);

        return (
          <div
            key={node.id}
            onClick={() => onSelectNode(node.id)}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${styles.bg} ${styles.border} ${
              isActive ? 'ring-2 ring-blue-400' : ''
            } hover:shadow-lg`}
          >
            <div className="flex items-start gap-3">
              <div className={`${styles.text} mt-1`}>
                <StatusIcon node={node} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-semibold ${styles.text}`}>{node.label}</h4>
                  <span className="px-2 py-0.5 text-xs bg-slate-600 text-slate-300 rounded">
                    {node.nodeType}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded ${styles.bg}`}>
                    {node.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-2">{node.details}</p>
                {doc && (
                  <div className="text-xs text-slate-500">
                    Created: {new Date(doc.createdAt).toLocaleDateString()} • 
                    Size: {doc.content.length} chars
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredAndSortedNodes.map(node => {
        const styles = NODE_STATUS_STYLES[node.status];
        const isActive = node.id === activeNodeId;
        const doc = docMap.get(node.id);

        return (
          <div
            key={node.id}
            onClick={() => onSelectNode(node.id)}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${styles.bg} ${styles.border} ${
              isActive ? 'ring-2 ring-blue-400' : ''
            } hover:shadow-lg`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`${styles.text}`}>
                <StatusIcon node={node} />
              </div>
              <h4 className={`font-semibold ${styles.text} truncate flex-1`}>{node.label}</h4>
            </div>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <span className="px-2 py-0.5 text-xs bg-slate-600 text-slate-300 rounded">
                  {node.nodeType}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded ${styles.bg}`}>
                  {node.status}
                </span>
              </div>
              
              <p className="text-sm text-slate-400 line-clamp-2">{node.details}</p>
              
              {doc && (
                <div className="text-xs text-slate-500">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'list': return renderListView();
      case 'grid': return renderGridView();
      case 'graph':
      default: return renderGraphView();
    }
  };

  const leftPanel = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-slate-100">{t.explorerTitle}</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {showFilters ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
        </div>
        
        {/* Search */}
        <input
          type="text"
          placeholder={t.searchDocs}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:ring-1 focus:ring-blue-500"
        />
        
        {/* Filters */}
        {showFilters && (
          <div className="space-y-2 mt-3">
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value as any)} 
              className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 text-sm"
            >
              <option value="ALL">{t.filterByStatus}</option>
              {Object.values(NodeStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            
            <select 
              value={sortOption} 
              onChange={e => setSortOption(e.target.value as any)} 
              className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 text-sm"
            >
              <option value="newest">{t.sortNewest}</option>
              <option value="oldest">{t.sortOldest}</option>
              <option value="az">{t.sortAZ}</option>
              <option value="za">{t.sortZA}</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
        )}
      </div>
      
      {/* View Mode Selector */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          {(['graph', 'list', 'grid'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                viewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Stats */}
      <div className="p-4 border-b border-slate-700">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-slate-400">
            Total: <span className="text-slate-200">{workflow.nodes.length}</span>
          </div>
          <div className="text-slate-400">
            Filtered: <span className="text-slate-200">{filteredAndSortedNodes.length}</span>
          </div>
          <div className="text-slate-400">
            Completed: <span className="text-green-400">
              {workflow.nodes.filter(n => n.status === NodeStatus.COMPLETED).length}
            </span>
          </div>
          <div className="text-slate-400">
            Active: <span className="text-blue-400">
              {activeNodeId ? 1 : 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const rightPanel = (
    <div className="h-full overflow-auto p-4">
      {filteredAndSortedNodes.length > 0 ? (
        renderContent()
      ) : (
        <div className="flex items-center justify-center h-full text-slate-500">
          <div className="text-center">
            <BrainCircuitIcon />
            <p className="mt-2">{t.noDocsMatch}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-lg ${className}`}>
      <ResizableLayout
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        defaultLeftWidth={300}
        minLeftWidth={250}
        maxLeftWidth={500}
      />
    </div>
  );
};

export default EnhancedDocumentExplorer;