import React, { useState, useCallback, useMemo } from 'react';
import { Document, GraphNode, NodeType } from '../types';
import { 
  DownloadIcon, 
  FileIcon, 
  FolderIcon, 
  TrashIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  CodeIcon,
  ImageIcon,
  FileTextIcon
} from './icons';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'svg' | 'mermaid' | 'markdown' | 'text'>('all');

  // Get node information for a document
  const getNodeInfo = useCallback((nodeId: string) => {
    return nodes.find(node => node.id === nodeId);
  }, [nodes]);

  // Detect content type
  const detectContentType = useCallback((doc: Document) => {
    const content = doc.content || '';
    if (content.includes('<svg') && content.includes('</svg>')) return 'svg';
    if (content.includes('graph') || content.includes('flowchart') || content.includes('sequenceDiagram')) return 'mermaid';
    if (content.includes('#') || content.includes('**') || content.includes('```')) return 'markdown';
    return 'text';
  }, []);

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    if (!documents || !Array.isArray(documents)) {
      return [];
    }
    let filtered = documents.filter(doc => {
      const nodeInfo = getNodeInfo(doc.nodeId);
      const searchMatch = !searchTerm || 
        (nodeInfo?.label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.outline || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const typeMatch = filterType === 'all' || detectContentType(doc) === filterType;
      
      return searchMatch && typeMatch;
    });

    // Sort documents
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          const aName = getNodeInfo(a.nodeId)?.label || '';
          const bName = getNodeInfo(b.nodeId)?.label || '';
          comparison = aName.localeCompare(bName);
          break;
        case 'date':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'size':
          const aSize = (a.outline?.length || 0) + (a.content?.length || 0) + (a.synthesis?.length || 0);
          const bSize = (b.outline?.length || 0) + (b.content?.length || 0) + (b.synthesis?.length || 0);
          comparison = aSize - bSize;
          break;
        case 'type':
          comparison = detectContentType(a).localeCompare(detectContentType(b));
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [documents, searchTerm, filterType, sortBy, sortOrder, getNodeInfo, detectContentType]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedDocuments.length / itemsPerPage);
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedDocuments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedDocuments, currentPage, itemsPerPage]);

  // Handle document selection
  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  // Select all visible documents
  const selectAllDocuments = () => {
    setSelectedDocuments(new Set(paginatedDocuments.map(doc => doc.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedDocuments(new Set());
  };

  // Handle sorting
  const handleSort = (field: 'name' | 'date' | 'size' | 'type') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Get enhanced document icon
  const getDocumentIcon = (doc: Document) => {
    const contentType = detectContentType(doc);
    switch (contentType) {
      case 'svg': return <ImageIcon />;
      case 'mermaid': return <CodeIcon />;
      case 'markdown': return <FileTextIcon />;
      default: return <EyeIcon />;
    }
  };

  // Get document type label
  const getDocumentTypeLabel = (doc: Document) => {
    const contentType = detectContentType(doc);
    switch (contentType) {
      case 'svg': return 'SVG';
      case 'mermaid': return 'Mermaid';
      case 'markdown': return 'Markdown';
      default: return 'Text';
    }
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
              {selectedDocuments.size} of {filteredAndSortedDocuments.length} selected
            </span>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded-md"
          >
            <option value="all">All Types</option>
            <option value="svg">SVG</option>
            <option value="mermaid">Mermaid</option>
            <option value="markdown">Markdown</option>
            <option value="text">Text</option>
          </select>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={selectAllDocuments}
              className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 rounded transition-colors"
            >
              Select Page
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 rounded transition-colors"
              disabled={selectedDocuments.size === 0}
            >
              Clear
            </button>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 text-slate-200 rounded"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="px-4 py-2 bg-slate-800/30 border-b border-slate-700">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">Sort by:</span>
          {(['name', 'date', 'size', 'type'] as const).map(field => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                sortBy === field 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {field.charAt(0).toUpperCase() + field.slice(1)}
              {sortBy === field && (
                sortOrder === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Document List */}
      <div className="max-h-96 overflow-y-auto">
        {paginatedDocuments.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FolderIcon />
            <p className="mt-2">
              {filteredAndSortedDocuments.length === 0 
                ? (searchTerm || filterType !== 'all' ? 'No documents match your filters' : 'No documents available')
                : 'No documents on this page'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {paginatedDocuments.map(doc => {
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
                      <div className="text-slate-300 mt-1">{getDocumentIcon(doc)}</div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-200">
                            {nodeInfo?.label || 'Unknown Node'}
                          </h4>
                          <span className="px-2 py-0.5 text-xs bg-slate-600 text-slate-300 rounded">
                            {getDocumentTypeLabel(doc)}
                          </span>
                          <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-400 rounded">
                            {nodeInfo?.nodeType || 'Unknown'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2 line-clamp-2">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-700 bg-slate-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedDocuments.length)} of {filteredAndSortedDocuments.length}
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 text-slate-200 rounded"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDocumentManager;