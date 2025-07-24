export enum NodeStatus {
  PENDING = 'PENDING',
  SYNTHESIZING = 'SYNTHESIZING',
  GENERATING_OUTLINE = 'GENERATING_OUTLINE',
  AWAITING_OUTLINE_REVIEW = 'AWAITING_OUTLINE_REVIEW',
  GENERATING_CONTENT = 'GENERATING_CONTENT',
  AWAITING_REVIEW = 'AWAITING_REVIEW',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  REFINING = 'REFINING',
}

export enum NodeType {
  TASK = 'TASK',
  SYNTHESIS = 'SYNTHESIS',
}

export type Language = 'en' | 'vi';

export interface GraphNode {
  id: string;
  label: string;
  nodeType: NodeType;
  status: NodeStatus;
  isHumanInLoop: boolean; // For final content review
  details: string;
  position: { x: number; y: number };
  useSearch?: boolean;

  // For SYNTHESIS nodes
  synthesisPrompt?: (projectDesc: string, previousOutputs: Record<string, string>, lang: Language) => string;
  
  // For TASK nodes
  outlinePrompt?: (projectDesc: string, synthesis: string, lang: Language) => string;
  taskPrompt?: (projectDesc:string, synthesis: string, outline: string, lang: Language) => string;
  refinePrompt?: (task: string, document: string, feedback: string, lang: Language) => string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface Document {
  id: string;
  nodeId: string;
  title: string;
  synthesis?: string;
  outline?: string;
  content: string;
  sources?: { uri: string; title: string; }[];
  createdAt: string;
  updatedAt: string;
  version: number;
  chatHistory: ChatMessage[];
  metadata: DocumentMetadata;
  parentDocumentId?: string;
  childDocumentIds: string[];
  relatedDocumentIds: string[];
  tags: string[];
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isApproved: boolean;
  approvalStage: 'outline' | 'content' | 'final' | 'approved';
}

export enum WorkflowStatus {
    IDLE = 'IDLE',
    RUNNING = 'RUNNING',
    PAUSED = 'PAUSED',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export interface ProjectState {
  id: string;
  description: string;
  language: Language;
  workflow: WorkflowGraph;
  documents: Document[];
  activeNodeId: string | null;
  workflowStatus: WorkflowStatus;
  history: Record<string, Document[]>; 
  streamingContent: string;
  streamingSource: 'outline' | 'content' | 'synthesis' | 'chat' | null;
  isStreaming: boolean;
  userFeedback: Record<string, string>;
  feedbackHistory: Record<string, string[]>;
}

export interface DocumentMetadata {
  wordCount: number;
  estimatedReadTime: number;
  lastModifiedBy: string;
  reviewers: string[];
  status: DocumentStatus;
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  completionPercentage: number;
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export interface ProjectHierarchy {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  childIds: string[];
  documentIds: string[];
  position: { x: number; y: number };
  isExpanded: boolean;
  color: string;
  icon: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  type: 'project' | 'document' | 'category';
  position: { x: number; y: number };
  size: { width: number; height: number };
  parentId?: string;
  childIds: string[];
  metadata: any;
  isCollapsed: boolean;
  style: {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
  };
}

export interface AppState {
    projects: ProjectState[];
    activeProjectId: string | null;
    projectHierarchy: ProjectHierarchy[];
    documentCategories: string[];
    globalSettings: {
      theme: 'light' | 'dark' | 'auto';
      language: Language;
      autoSave: boolean;
      defaultView: 'graph' | 'list' | 'grid';
    };
}