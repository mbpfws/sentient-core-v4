import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GraphNode, GraphEdge, NodeStatus, NodeType } from '../types';
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
  ExpandIcon,
  ToggleLeftIcon,
  ToggleRightIcon
} from './icons';

interface EnhancedWorkflowVisualizerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  activeNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
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

const EnhancedWorkflowVisualizer: React.FC<EnhancedWorkflowVisualizerProps> = ({ 
  nodes, 
  edges, 
  activeNodeId, 
  onNodeClick, 
  t,
  className = ''
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showMinimap, setShowMinimap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [autoLayout, setAutoLayout] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<'hierarchical' | 'circular' | 'force'>('hierarchical');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  // Calculate graph bounds
  const graphBounds = React.useMemo(() => {
    if (nodes.length === 0) return { minX: 0, maxX: 1400, minY: 0, maxY: 700 };
    
    const bounds = nodes.reduce((acc, node) => ({
      minX: Math.min(acc.minX, node.position.x),
      maxX: Math.max(acc.maxX, node.position.x + 200),
      minY: Math.min(acc.minY, node.position.y),
      maxY: Math.max(acc.maxY, node.position.y + 100)
    }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
    
    return {
      minX: bounds.minX - 50,
      maxX: bounds.maxX + 50,
      minY: bounds.minY - 50,
      maxY: bounds.maxY + 50
    };
  }, [nodes]);

  const graphWidth = graphBounds.maxX - graphBounds.minX;
  const graphHeight = graphBounds.maxY - graphBounds.minY;

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.3));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleFitToView = useCallback(() => {
    if (containerRef.current && nodes.length > 0) {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      const scaleX = (containerRect.width - 100) / graphWidth;
      const scaleY = (containerRect.height - 100) / graphHeight;
      const scale = Math.min(scaleX, scaleY, 2) * 0.9;
      
      setZoomLevel(scale);
      
      // Center the graph
      const centerX = (containerRect.width - graphWidth * scale) / 2;
      const centerY = (containerRect.height - graphHeight * scale) / 2;
      setPanOffset({ x: centerX, y: centerY });
    }
  }, [nodes, graphWidth, graphHeight]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel(prev => Math.max(0.3, Math.min(3, prev + delta)));
  }, []);

  // Auto-layout algorithms
  const applyLayout = useCallback((layoutType: 'hierarchical' | 'circular' | 'force') => {
    // This would implement different layout algorithms
    // For now, we'll just trigger a re-render
    setSelectedLayout(layoutType);
  }, []);

  const renderGrid = () => {
    if (!showGrid) return null;
    
    const gridSize = 50 * zoomLevel;
    const offsetX = panOffset.x % gridSize;
    const offsetY = panOffset.y % gridSize;
    
    return (
      <svg 
        className="absolute inset-0 pointer-events-none" 
        style={{ opacity: 0.1 }}
      >
        <defs>
          <pattern 
            id="grid" 
            width={gridSize} 
            height={gridSize} 
            patternUnits="userSpaceOnUse"
            x={offsetX}
            y={offsetY}
          >
            <path 
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} 
              fill="none" 
              stroke="#475569" 
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    );
  };

  const renderMinimap = () => {
    if (!showMinimap) return null;
    
    const minimapScale = 0.15;
    const minimapWidth = graphWidth * minimapScale;
    const minimapHeight = graphHeight * minimapScale;
    
    return (
      <div className="absolute bottom-4 right-4 bg-slate-800/90 backdrop-blur-sm border border-slate-600 rounded-lg p-2">
        <div className="text-xs text-slate-400 mb-1">Minimap</div>
        <div 
          className="relative bg-slate-900/50 rounded overflow-hidden cursor-pointer"
          style={{ width: Math.max(150, minimapWidth), height: Math.max(100, minimapHeight) }}
        >
          {/* Minimap nodes */}
          {nodes.map(node => {
            const isActive = node.id === activeNodeId;
            const x = (node.position.x - graphBounds.minX) * minimapScale;
            const y = (node.position.y - graphBounds.minY) * minimapScale;
            
            return (
              <div
                key={node.id}
                className={`absolute w-2 h-2 rounded-sm transition-all ${
                  isActive ? 'bg-blue-400' : 'bg-slate-400'
                }`}
                style={{ left: x, top: y }}
              />
            );
          })}
          
          {/* Viewport indicator */}
          <div 
            className="absolute border border-blue-400 bg-blue-400/20"
            style={{
              left: Math.max(0, -panOffset.x * minimapScale / zoomLevel),
              top: Math.max(0, -panOffset.y * minimapScale / zoomLevel),
              width: Math.min(minimapWidth, (containerRef.current?.clientWidth || 0) * minimapScale / zoomLevel),
              height: Math.min(minimapHeight, (containerRef.current?.clientHeight || 0) * minimapScale / zoomLevel)
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`relative w-full h-full bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-200">{t.workflowGraphTitle}</h3>
          
          <div className="flex items-center gap-2">
            {/* Layout Controls */}
            <select
              value={selectedLayout}
              onChange={(e) => applyLayout(e.target.value as any)}
              className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 text-slate-200 rounded"
            >
              <option value="hierarchical">Hierarchical</option>
              <option value="circular">Circular</option>
              <option value="force">Force-directed</option>
            </select>
            
            {/* View Options */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1 text-xs rounded transition-colors ${
                showGrid ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              title="Toggle Grid"
            >
              Grid
            </button>
            
            <button
              onClick={() => setShowMinimap(!showMinimap)}
              className={`p-1 text-xs rounded transition-colors ${
                showMinimap ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              title="Toggle Minimap"
            >
              Map
            </button>
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 border border-slate-600">
          <div className="flex flex-col gap-1">
            <button
              onClick={handleZoomIn}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomInIcon />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOutIcon />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Reset View"
            >
              <RefreshIcon />
            </button>
            <button
              onClick={handleFitToView}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Fit to View"
            >
              <MaximizeIcon />
            </button>
          </div>
          <div className="text-xs text-slate-400 text-center mt-2 px-1">
            {Math.round(zoomLevel * 100)}%
          </div>
        </div>
      </div>

      {/* Graph Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 pt-16 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {renderGrid()}
        
        <div 
          className="relative transition-transform duration-200"
          style={{ 
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: '0 0',
            width: graphWidth,
            height: graphHeight
          }}
        >
          {/* Edges */}
          <svg 
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <marker 
                id="arrow-default" 
                viewBox="0 0 10 10" 
                refX="8" 
                refY="5" 
                markerWidth="6" 
                markerHeight="6" 
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
              </marker>
              <marker 
                id="arrow-completed" 
                viewBox="0 0 10 10" 
                refX="8" 
                refY="5" 
                markerWidth="6" 
                markerHeight="6" 
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#22c55e" />
              </marker>
              <marker 
                id="arrow-active" 
                viewBox="0 0 10 10" 
                refX="8" 
                refY="5" 
                markerWidth="6" 
                markerHeight="6" 
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
              </marker>
            </defs>
            
            {edges.map(edge => {
              const sourceNode = nodeMap.get(edge.source);
              const targetNode = nodeMap.get(edge.target);
              if (!sourceNode || !targetNode) return null;

              const isCompleted = sourceNode.status === NodeStatus.COMPLETED && 
                [NodeStatus.COMPLETED, NodeStatus.AWAITING_REVIEW, NodeStatus.AWAITING_OUTLINE_REVIEW, 
                 NodeStatus.GENERATING_CONTENT, NodeStatus.GENERATING_OUTLINE, NodeStatus.SYNTHESIZING].includes(targetNode.status);
              
              const isActive = edge.source === activeNodeId || edge.target === activeNodeId;
              
              let strokeColor = '#475569';
              let markerId = 'arrow-default';
              
              if (isActive) {
                strokeColor = '#3b82f6';
                markerId = 'arrow-active';
              } else if (isCompleted) {
                strokeColor = '#22c55e';
                markerId = 'arrow-completed';
              }

              return (
                <g key={edge.id}>
                  <line
                    x1={sourceNode.position.x - graphBounds.minX + 200}
                    y1={sourceNode.position.y - graphBounds.minY + 50}
                    x2={targetNode.position.x - graphBounds.minX}
                    y2={targetNode.position.y - graphBounds.minY + 50}
                    stroke={strokeColor}
                    strokeWidth={isActive ? "3" : "2"}
                    markerEnd={`url(#${markerId})`}
                    className="transition-all duration-300"
                    opacity={isActive ? 1 : 0.7}
                  />
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const styles = NODE_STATUS_STYLES[node.status];
            const isActive = node.id === activeNodeId;

            return (
              <div
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeClick(node.id);
                }}
                className={`absolute p-4 rounded-lg border-2 w-52 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-blue-500/30 ${styles.bg} ${styles.border} ${
                  isActive ? 'ring-2 ring-blue-400 scale-105 z-10' : 'hover:scale-102'
                }`}
                style={{ 
                  top: node.position.y - graphBounds.minY, 
                  left: node.position.x - graphBounds.minX
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
                
                <div className="text-xs text-slate-400 mb-2">
                  {node.nodeType} • {node.status}
                </div>
                
                <p className="text-xs text-slate-500 line-clamp-2">
                  {node.details}
                </p>
              </div>
            );
          })}
        </div>
        
        {renderMinimap()}
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-sm border-t border-slate-700 p-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>Nodes: {nodes.length}</span>
            <span>Edges: {edges.length}</span>
            <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">
              ● {nodes.filter(n => n.status === NodeStatus.COMPLETED).length} Completed
            </span>
            <span className="text-yellow-400">
              ● {nodes.filter(n => n.status === NodeStatus.GENERATING_CONTENT || n.status === NodeStatus.GENERATING_OUTLINE).length} Processing
            </span>
            <span className="text-red-400">
              ● {nodes.filter(n => n.status === NodeStatus.ERROR).length} Error
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWorkflowVisualizer;