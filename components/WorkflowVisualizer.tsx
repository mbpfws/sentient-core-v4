
import React from 'react';
import { GraphNode, GraphEdge, NodeStatus, NodeType } from '../types';
import { NODE_STATUS_STYLES } from '../constants';
import { CheckCircleIcon, XCircleIcon, PauseCircleIcon, LoaderIcon, BrainCircuitIcon, BotIcon } from './icons';

interface WorkflowVisualizerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  activeNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  t: any; // Translation object
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

const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({ nodes, edges, activeNodeId, onNodeClick, t }) => {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  return (
    <div className="relative w-full h-full bg-slate-900/50 rounded-lg overflow-auto p-4 border border-slate-700">
      <h3 className="text-lg font-semibold text-slate-200 mb-4 sticky top-0 left-0 bg-slate-900/50 backdrop-blur-sm z-10 p-2 rounded-md">{t.workflowGraphTitle}</h3>
      <div className="relative" style={{ width: 1400, height: 700 }}>
        <svg className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          {edges.map(edge => {
            const sourceNode = nodeMap.get(edge.source);
            const targetNode = nodeMap.get(edge.target);
            if (!sourceNode || !targetNode) return null;

            const isCompleted = sourceNode.status === NodeStatus.COMPLETED && [NodeStatus.COMPLETED, NodeStatus.AWAITING_REVIEW, NodeStatus.AWAITING_OUTLINE_REVIEW, NodeStatus.GENERATING_CONTENT, NodeStatus.GENERATING_OUTLINE, NodeStatus.SYNTHESIZING].includes(targetNode.status);
            const strokeColor = isCompleted ? '#22c55e' : '#475569';
            const markerId = isCompleted ? 'arrow-completed' : 'arrow-default';

            return (
              <g key={edge.id}>
                <defs>
                  <marker id="arrow-default" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                  </marker>
                   <marker id="arrow-completed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#22c55e" />
                  </marker>
                </defs>
                <line
                  x1={sourceNode.position.x + 180}
                  y1={sourceNode.position.y + 40}
                  x2={targetNode.position.x}
                  y2={targetNode.position.y + 40}
                  stroke={strokeColor}
                  strokeWidth="2"
                  markerEnd={`url(#${markerId})`}
                  className="transition-all duration-500"
                />
              </g>
            );
          })}
        </svg>

        {nodes.map(node => {
          const styles = NODE_STATUS_STYLES[node.status];
          const isActive = node.id === activeNodeId;

          return (
            <div
              key={node.id}
              onClick={() => onNodeClick(node.id)}
              className={`absolute p-3 rounded-lg border-2 w-48 h-auto flex flex-col cursor-pointer transition-all duration-300 shadow-lg hover:shadow-blue-500/30 ${styles.bg} ${styles.border} ${isActive ? 'ring-2 ring-blue-400' : ''}`}
              style={{ top: node.position.y, left: node.position.x, transform: isActive ? 'scale(1.05)' : 'scale(1)' }}
              title={node.details}
            >
              <div className="flex items-center gap-2 mb-1">
                 <div className={`${styles.text}`}><StatusIcon node={node} /></div>
                 <h4 className={`font-bold text-sm ${styles.text}`}>{node.label}</h4>
              </div>
              <p className="text-xs text-slate-400">{node.details}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowVisualizer;
