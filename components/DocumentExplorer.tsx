import React, { useState, useMemo } from 'react';
import { Document, WorkflowGraph, GraphNode, NodeStatus, NodeType } from '../types';
import { NODE_STATUS_STYLES } from '../constants';
import { CheckCircleIcon, XCircleIcon, PauseCircleIcon, LoaderIcon, BrainCircuitIcon, BotIcon } from './icons';

interface DocumentExplorerProps {
    workflow: WorkflowGraph;
    documents: Document[];
    onSelectNode: (nodeId: string) => void;
    activeNodeId: string | null;
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

type SortOption = 'newest' | 'oldest' | 'az' | 'za';

const DocumentExplorer: React.FC<DocumentExplorerProps> = ({ workflow, documents, onSelectNode, activeNodeId, t }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<NodeStatus | 'ALL'>('ALL');
    const [sortOption, setSortOption] = useState<SortOption>('newest');
    
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
                case 'newest':
                default:
                    return dateB - dateA;
            }
        });

        return nodes;
    }, [workflow.nodes, docMap, searchTerm, statusFilter, sortOption]);

    return (
        <div className="flex flex-col h-full bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="p-4 border-b border-slate-700">
                <h3 className="text-lg font-bold text-slate-100 mb-2">{t.explorerTitle}</h3>
                <input
                    type="text"
                    placeholder={t.searchDocs}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex gap-2 mt-2">
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="flex-1 p-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 text-sm">
                        <option value="ALL">{t.filterByStatus}</option>
                        {Object.values(NodeStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={sortOption} onChange={e => setSortOption(e.target.value as any)} className="flex-1 p-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 text-sm">
                        <option value="newest">{t.sortNewest}</option>
                        <option value="oldest">{t.sortOldest}</option>
                        <option value="az">{t.sortAZ}</option>
                        <option value="za">{t.sortZA}</option>
                    </select>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto p-4">
                 {filteredAndSortedNodes.length > 0 ? (
                    <div className="relative" style={{ width: '100%', height: workflow.nodes.length * 90 }}>
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
                                  y1={sourceNode.position.y + 28}
                                  x2={targetNode.position.x}
                                  y2={targetNode.position.y + 28}
                                  stroke={strokeColor}
                                  strokeWidth="1"
                                  className="transition-all duration-500 opacity-50"
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

                            return (
                                <div
                                key={node.id}
                                onClick={() => onSelectNode(node.id)}
                                className={`absolute p-2 rounded-lg border-2 w-48 h-auto flex items-center gap-2 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-blue-500/30 ${styles.bg} ${styles.border} ${isActive ? 'ring-2 ring-blue-400' : ''} ${isVisible ? 'opacity-100' : 'opacity-30'}`}
                                style={{ top: node.position.y, left: node.position.x, transform: isActive ? 'scale(1.05)' : 'scale(1)' }}
                                title={node.details}
                                >
                                    <div className={`${styles.text}`}><StatusIcon node={node} /></div>
                                    <h4 className={`font-bold text-sm ${styles.text} truncate`}>{node.label}</h4>
                                </div>
                            )
                        })}
                    </div>
                 ) : (
                    <div className="p-8 text-center text-slate-500">{t.noDocsMatch}</div>
                 )}
            </div>
        </div>
    );
};

export default DocumentExplorer;