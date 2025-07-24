import { Document, ProjectHierarchy, MindMapNode, DocumentMetadata, DocumentStatus } from '../types';

export class EnhancedDocumentService {
  /**
   * Calculate document metadata automatically
   */
  static calculateDocumentMetadata(content: string, title: string): DocumentMetadata {
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const estimatedReadTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words/minute
    
    // Determine complexity based on content length and technical terms
    const technicalTerms = ['API', 'database', 'algorithm', 'framework', 'architecture', 'implementation'];
    const technicalTermCount = technicalTerms.reduce((count, term) => 
      count + (content.toLowerCase().includes(term.toLowerCase()) ? 1 : 0), 0);
    
    let complexity: 'simple' | 'moderate' | 'complex' | 'expert' = 'simple';
    if (wordCount > 2000 || technicalTermCount > 5) complexity = 'expert';
    else if (wordCount > 1000 || technicalTermCount > 3) complexity = 'complex';
    else if (wordCount > 500 || technicalTermCount > 1) complexity = 'moderate';
    
    return {
      wordCount,
      estimatedReadTime,
      lastModifiedBy: 'AI Agent',
      reviewers: [],
      status: DocumentStatus.DRAFT,
      complexity,
      completionPercentage: content.length > 100 ? 85 : 50
    };
  }

  /**
   * Create hierarchical project structure from documents
   */
  static createProjectHierarchy(documents: Document[], projectId: string): ProjectHierarchy[] {
    const hierarchy: ProjectHierarchy[] = [];
    const categoryMap = new Map<string, string[]>();
    
    // Group documents by category
    documents.forEach(doc => {
      if (!categoryMap.has(doc.category)) {
        categoryMap.set(doc.category, []);
      }
      categoryMap.get(doc.category)!.push(doc.id);
    });

    // Create hierarchy nodes for each category
    let yOffset = 0;
    categoryMap.forEach((docIds, category) => {
      const hierarchyNode: ProjectHierarchy = {
        id: `${projectId}-${category}`,
        name: category || 'Uncategorized',
        description: `Category containing ${docIds.length} documents`,
        documentIds: docIds,
        childIds: [],
        position: { x: 100, y: yOffset },
        isExpanded: true,
        color: this.getCategoryColor(category),
        icon: this.getCategoryIcon(category)
      };
      hierarchy.push(hierarchyNode);
      yOffset += 150;
    });

    return hierarchy;
  }

  /**
   * Generate mind map nodes from project hierarchy
   */
  static generateMindMapNodes(hierarchy: ProjectHierarchy[], documents: Document[]): MindMapNode[] {
    const mindMapNodes: MindMapNode[] = [];
    const docMap = new Map(documents.map(d => [d.id, d]));

    hierarchy.forEach((project, index) => {
      // Create project node
      const projectNode: MindMapNode = {
        id: project.id,
        label: project.name,
        type: 'project',
        position: project.position,
        size: { width: 200, height: 80 },
        childIds: project.documentIds,
        metadata: { documentCount: project.documentIds.length },
        isCollapsed: !project.isExpanded,
        style: {
          backgroundColor: project.color,
          borderColor: this.darkenColor(project.color),
          textColor: '#ffffff'
        }
      };
      mindMapNodes.push(projectNode);

      // Create document nodes for this project
      project.documentIds.forEach((docId, docIndex) => {
        const doc = docMap.get(docId);
        if (doc && doc.metadata) {
          const angle = (docIndex / project.documentIds.length) * 2 * Math.PI;
          const radius = 120;
          const docNode: MindMapNode = {
            id: docId,
            label: doc.title,
            type: 'document',
            position: {
              x: project.position.x + Math.cos(angle) * radius,
              y: project.position.y + Math.sin(angle) * radius
            },
            size: { width: 150, height: 60 },
            parentId: project.id,
            childIds: doc.childDocumentIds,
            metadata: doc.metadata || { status: 'draft', priority: 'medium', tags: [], estimatedReadTime: 0 },
            isCollapsed: false,
            style: {
              backgroundColor: this.getDocumentColor(doc.metadata?.status || 'draft'),
              borderColor: this.darkenColor(this.getDocumentColor(doc.metadata?.status || 'draft')),
              textColor: '#333333'
            }
          };
          mindMapNodes.push(docNode);
        }
      });
    });

    return mindMapNodes;
  }

  /**
   * Search documents with advanced filtering
   */
  static searchDocuments(
    documents: Document[],
    searchTerm: string,
    filters: {
      status?: DocumentStatus;
      category?: string;
      priority?: string;
      tags?: string[];
      dateRange?: { start: Date; end: Date };
    }
  ): Document[] {
    return documents.filter(doc => {
      // Text search
      const matchesSearch = !searchTerm || 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status filter
      const matchesStatus = !filters.status || doc.metadata.status === filters.status;

      // Category filter
      const matchesCategory = !filters.category || doc.category === filters.category;

      // Priority filter
      const matchesPriority = !filters.priority || doc.priority === filters.priority;

      // Tags filter
      const matchesTags = !filters.tags || filters.tags.length === 0 || 
        filters.tags.some(tag => doc.tags.includes(tag));

      // Date range filter
      const matchesDateRange = !filters.dateRange || (
        new Date(doc.createdAt) >= filters.dateRange.start &&
        new Date(doc.createdAt) <= filters.dateRange.end
      );

      return matchesSearch && matchesStatus && matchesCategory && 
             matchesPriority && matchesTags && matchesDateRange;
    });
  }

  /**
   * Get related documents based on tags and content similarity
   */
  static getRelatedDocuments(targetDoc: Document, allDocuments: Document[], limit: number = 5): Document[] {
    const related = allDocuments
      .filter(doc => doc.id !== targetDoc.id)
      .map(doc => ({
        document: doc,
        score: this.calculateSimilarityScore(targetDoc, doc)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.document);

    return related;
  }

  private static calculateSimilarityScore(doc1: Document, doc2: Document): number {
    let score = 0;

    // Tag similarity
    const commonTags = doc1.tags.filter(tag => doc2.tags.includes(tag));
    score += commonTags.length * 10;

    // Category similarity
    if (doc1.category === doc2.category) score += 20;

    // Priority similarity
    if (doc1.priority === doc2.priority) score += 5;

    // Content similarity (basic keyword matching)
    const keywords1 = this.extractKeywords(doc1.content);
    const keywords2 = this.extractKeywords(doc2.content);
    const commonKeywords = keywords1.filter(kw => keywords2.includes(kw));
    score += commonKeywords.length * 2;

    return score;
  }

  private static extractKeywords(content: string): string[] {
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 20); // Top 20 words
  }

  private static getCategoryColor(category: string): string {
    const colors = {
      'Technical': '#3B82F6',
      'Business': '#10B981',
      'Design': '#F59E0B',
      'Research': '#8B5CF6',
      'Documentation': '#6B7280',
      'Planning': '#EF4444'
    };
    return colors[category as keyof typeof colors] || '#6B7280';
  }

  private static getCategoryIcon(category: string): string {
    const icons = {
      'Technical': '⚙️',
      'Business': '💼',
      'Design': '🎨',
      'Research': '🔬',
      'Documentation': '📄',
      'Planning': '📋'
    };
    return icons[category as keyof typeof icons] || '📄';
  }

  private static getDocumentColor(status: DocumentStatus): string {
    const colors = {
      [DocumentStatus.DRAFT]: '#FEF3C7',
      [DocumentStatus.IN_REVIEW]: '#DBEAFE',
      [DocumentStatus.APPROVED]: '#D1FAE5',
      [DocumentStatus.PUBLISHED]: '#E0E7FF',
      [DocumentStatus.ARCHIVED]: '#F3F4F6'
    };
    return colors[status];
  }

  private static darkenColor(color: string): string {
    // Simple color darkening - in production, use a proper color manipulation library
    return color.replace(/[0-9A-F]/g, (char) => {
      const num = parseInt(char, 16);
      return Math.max(0, num - 2).toString(16).toUpperCase();
    });
  }
}
