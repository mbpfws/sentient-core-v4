import React, { useState, useCallback } from 'react';
import { Document, GraphNode, NodeType } from '../types';
import { DownloadIcon, FileIcon, FolderIcon, TrashIcon } from './icons';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

interface EnhancedDocumentManagerProps {
  documents: Document[];
  nodes: GraphNode[];
  onDeleteDocument: (documentId: string) => void;
  onExportDocuments: (format: 'json' | 'zip') => void;
  className?: string;
}

const EnhancedDocumentManager: React.FC<EnhancedDocumentManagerProps> = ({
  documents,
  nodes,
  onDeleteDocument,
  onExportDocuments,
  className = ""
}) => {
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [exportFormat, setExportFormat] = useState<'json' | 'zip'>('zip');

  // Get node information for a document
  const getNodeInfo = useCallback((nodeId: string) => {
    return nodes.find(node => node.id === nodeId);
  }, [nodes]);

  // Handle document selection
  const toggleDocumentSelection = (documentId: string) => {
    const newSelection = new Set(selectedDocuments);
    if (newSelection.has(documentId)) {
      newSelection.delete(documentId);
    } else {
      newSelection.add(documentId);
    }
    setSelectedDocuments(newSelection);
  };

  // Select all documents
  const selectAllDocuments = () => {
    setSelectedDocuments(new Set(documents.map(doc => doc.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedDocuments(new Set());
  };

  // Export selected documents
  const exportSelectedDocuments = async () => {
    const selectedDocs = documents.filter(doc => selectedDocuments.has(doc.id));
    
    if (selectedDocs.length === 0) {
      alert('Please select at least one document to export.');
      return;
    }

    if (exportFormat === 'json') {
      const exportData = {
        exportDate: new Date().toISOString(),
        documents: selectedDocs.map(doc => ({
          ...doc,
          nodeInfo: getNodeInfo(doc.nodeId)
        }))
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      saveAs(blob, `sentient-documents-${new Date().toISOString().split('T')[0]}.json`);
    } else {
      // ZIP export
      const zip = new JSZip();
      const folder = zip.folder('sentient-documents');
      
      selectedDocs.forEach(doc => {
        const nodeInfo = getNodeInfo(doc.nodeId);
        const folderName = nodeInfo ? nodeInfo.label.replace(/[^a-zA-Z0-9]/g, '_') : 'unknown_node';
        const nodeFolder = folder?.folder(folderName);
        
        // Add outline if exists
        if (doc.outline) {
          nodeFolder?.file('outline.txt', doc.outline);
        }
        
        // Add content based on node type
        if (doc.content) {
          if (nodeInfo?.id === 'n7') {
            // SVG content for Front-end Mockup Interfaces
            nodeFolder?.file('mockup.svg', doc.content);
          } else if (nodeInfo?.id === 'n8') {
            // Mermaid content for Architectural Visualizer
            nodeFolder?.file('diagram.mmd', doc.content);
          } else {
            // Regular text content
            nodeFolder?.file('content.txt', doc.content);
          }
        }
        
        // Add synthesis if exists
        if (doc.synthesis) {
          nodeFolder?.file('synthesis.txt', doc.synthesis);
        }
        
        // Add metadata
        const metadata = {
          nodeId: doc.nodeId,
          nodeLabel: nodeInfo?.label || 'Unknown',
          nodeType: nodeInfo?.nodeType || 'Unknown',
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          sources: doc.sources || []
        };
        nodeFolder?.file('metadata.json', JSON.stringify(metadata, null, 2));
      });
      
      // Generate and download ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `sentient-documents-${new Date().toISOString().split('T')[0]}.zip`);
    }
    
    clearSelection();
  };

  // Delete selected documents
  const deleteSelectedDocuments = () => {
    if (selectedDocuments.size === 0) {
      alert('Please select at least one document to delete.');
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${selectedDocuments.size} document(s)?`)) {
      selectedDocuments.forEach(docId => onDeleteDocument(docId));
      clearSelection();
    }
  };

  // Get document type icon
  const getDocumentIcon = (doc: Document) => {
    const nodeInfo = getNodeInfo(doc.nodeId);
    if (nodeInfo?.id === 'n7') return '🎨'; // SVG mockups
    if (nodeInfo?.id === 'n8') return '📊'; // Mermaid diagrams
    if (nodeInfo?.nodeType === NodeType.SYNTHESIS) return '📋';
    return '📄';
  };

  // Get document size estimate
  const getDocumentSize = (doc: Document) => {
    const totalSize = (doc.outline?.length || 0) + (doc.content?.length || 0) + (doc.synthesis?.length || 0);
    if (totalSize < 1024) return `${totalSize} B`;
    if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(1)} KB`;
    return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-200">Document Manager</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              {selectedDocuments.size} of {documents.length} selected
            </span>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={selectAllDocuments}
              className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 rounded transition-colors"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 rounded transition-colors"
              disabled={selectedDocuments.size === 0}
            >
              Clear
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'json' | 'zip')}
              className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 text-slate-200 rounded"
            >
              <option value="zip">ZIP Archive</option>
              <option value="json">JSON Export</option>
            </select>
            
            <button
              onClick={exportSelectedDocuments}
              disabled={selectedDocuments.size === 0}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded flex items-center gap-1 transition-colors"
            >
              <DownloadIcon /> Export
            </button>
            
            <button
              onClick={deleteSelectedDocuments}
              disabled={selectedDocuments.size === 0}
              className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded flex items-center gap-1 transition-colors"
            >
              <TrashIcon /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="max-h-96 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FolderIcon />
            <p className="mt-2">No documents available</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {documents.map(doc => {
              const nodeInfo = getNodeInfo(doc.nodeId);
              const isSelected = selectedDocuments.has(doc.id);
              
              return (
                <div
                  key={doc.id}
                  className={`p-4 hover:bg-slate-700/50 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-900/30 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => toggleDocumentSelection(doc.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-grow">
                      <div className="text-2xl">{getDocumentIcon(doc)}</div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-200">
                            {nodeInfo?.label || 'Unknown Node'}
                          </h4>
                          <span className="px-2 py-0.5 text-xs bg-slate-600 text-slate-300 rounded">
                            {nodeInfo?.nodeType || 'Unknown'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">
                          {nodeInfo?.details || 'No description available'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Size: {getDocumentSize(doc)}</span>
                          <span>Updated: {new Date(doc.updatedAt).toLocaleDateString()}</span>
                          {doc.sources && doc.sources.length > 0 && (
                            <span>Sources: {doc.sources.length}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDocumentSelection(doc.id)}
                        className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDocumentManager;