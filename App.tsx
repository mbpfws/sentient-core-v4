import React, { useState, useEffect, useCallback, useReducer, useMemo } from 'react';
import { AppState, ProjectState, WorkflowStatus, NodeStatus, Document, GraphNode, NodeType, Language, ChatMessage } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { INITIAL_WORKFLOW_GRAPH, VIETNAMESE_WORKFLOW_GRAPH } from './constants';
import { GeminiService } from './services/geminiService';
import { locales } from './locales';
import Header from './components/Header';
import ProjectInput from './components/ProjectInput';
import WorkflowVisualizer from './components/WorkflowVisualizer';
import EnhancedWorkflowVisualizer from './components/EnhancedWorkflowVisualizer';
import DocumentViewer from './components/DocumentViewer';
import EnhancedDocumentViewer from './components/EnhancedDocumentViewer';
import EdgeCaseSimulator from './components/EdgeCaseSimulator';
import ProjectManager from './components/ProjectManager';
import DocumentExplorer from './components/DocumentExplorer';
import EnhancedDocumentExplorer from './components/EnhancedDocumentExplorer';
import EnhancedDocumentManager from './components/EnhancedDocumentManager';
import ChatPanel from './components/ChatPanel';
import NodeTester from './components/NodeTester';
import { LayoutGridIcon, NetworkIcon } from './components/icons';
import ApiKeyModal from './components/ApiKeyModal';
import { ResizableLayout } from './components/ResizableLayout';

type ProjectAction =
    | { type: 'START_WORKFLOW'; payload: { description: string } }
    | { type: 'RESET_WORKFLOW' }
    | { type: 'SET_ACTIVE_NODE'; payload: { nodeId: string | null } }
    | { type: 'UPDATE_NODE_STATUS'; payload: { nodeId: string; status: NodeStatus } }
    | { type: 'START_STREAMING'; payload: { nodeId: string; source: ProjectState['streamingSource'] } }
    | { type: 'APPEND_STREAMING_CONTENT'; payload: { chunk: string } }
    | { type: 'END_STREAMING_SYNTHESIS'; payload: { nodeId: string; content: string; } }
    | { type: 'END_STREAMING_OUTLINE'; payload: { nodeId: string; outline: string; } }
    | { type: 'END_STREAMING_CONTENT'; payload: { nodeId: string; content: string; sources?: {uri: string; title: string}[] } }
    | { type: 'SET_WORKFLOW_STATUS'; payload: { status: WorkflowStatus } }
    | { type: 'SET_USER_FEEDBACK'; payload: { nodeId: string; feedback: string } }
    | { type: 'ADD_CHAT_MESSAGE'; payload: { nodeId: string; message: ChatMessage } }
    | { type: 'END_CHAT_STREAM'; payload: { nodeId: string; fullResponse: string } };

type AppAction =
    | { type: 'CREATE_PROJECT'; payload: { description: string } }
    | { type: 'SELECT_PROJECT'; payload: { projectId: string | null } }
    | { type: 'DELETE_PROJECT'; payload: { projectId: string } }
    | { type: 'DISPATCH_TO_PROJECT'; payload: { projectId: string; action: ProjectAction } };


const initialProjectState: Omit<ProjectState, 'id' | 'description' | 'language' | 'workflow'> = {
    documents: [],
    activeNodeId: null,
    workflowStatus: WorkflowStatus.IDLE,
    history: {},
    streamingContent: '',
    isStreaming: false,
    streamingSource: null,
    userFeedback: {},
    feedbackHistory: {}
};

const detectLanguage = (text: string): Language => {
    const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    return vietnameseRegex.test(text) ? 'vi' : 'en';
};

function upsertDocument(docs: Document[], newDoc: Partial<Document> & { nodeId: string }, workflow: ProjectState['workflow']): Document[] {
    const { nodeId } = newDoc;
    const existingDocIndex = docs.findIndex(d => d.nodeId === nodeId);
    
    if (existingDocIndex > -1) {
        const oldDoc = docs[existingDocIndex];
        const updatedDoc = { ...oldDoc, ...newDoc, version: oldDoc.version + 1, createdAt: new Date().toISOString() };
        const newDocs = [...docs];
        newDocs[existingDocIndex] = updatedDoc;
        return newDocs;
    } else {
        const node = workflow.nodes.find(n => n.id === nodeId);
        const fullNewDoc: Document = {
            id: `doc_${nodeId}_${Date.now()}`,
            nodeId,
            title: node!.label,
            content: '',
            version: 1,
            createdAt: new Date().toISOString(),
            chatHistory: [],
            ...newDoc
        };
        return [...docs, fullNewDoc];
    }
}

function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
    switch (action.type) {
        case 'START_WORKFLOW': {
            const firstNode = state.workflow.nodes[0];
            return {
                ...state,
                workflowStatus: WorkflowStatus.RUNNING,
                workflow: {
                    ...state.workflow,
                    nodes: state.workflow.nodes.map(n => ({...n, status: n.id === firstNode.id ? NodeStatus.PENDING : NodeStatus.PENDING}))
                }
            };
        }
        case 'RESET_WORKFLOW':
            const lang = detectLanguage(state.description);
            const initialGraph = lang === 'vi' ? VIETNAMESE_WORKFLOW_GRAPH : INITIAL_WORKFLOW_GRAPH;
            return {
                ...state,
                ...initialProjectState,
                workflow: initialGraph,
            };
        case 'SET_ACTIVE_NODE':
            return { ...state, activeNodeId: action.payload.nodeId };
        case 'UPDATE_NODE_STATUS': {
            const newNodes = state.workflow.nodes.map(n =>
                n.id === action.payload.nodeId ? { ...n, status: action.payload.status } : n
            );
            return { ...state, workflow: { ...state.workflow, nodes: newNodes } };
        }
        case 'START_STREAMING':
            return { ...state, isStreaming: true, streamingContent: '', activeNodeId: action.payload.nodeId, streamingSource: action.payload.source };
        case 'APPEND_STREAMING_CONTENT':
            return { ...state, streamingContent: state.streamingContent + action.payload.chunk };
        case 'END_STREAMING_SYNTHESIS': {
             const newDocuments = upsertDocument(state.documents, { nodeId: action.payload.nodeId, content: action.payload.content }, state.workflow);
             return { ...state, isStreaming: false, streamingSource: null, documents: newDocuments };
        }
        case 'END_STREAMING_OUTLINE': {
             const newDocuments = upsertDocument(state.documents, { nodeId: action.payload.nodeId, outline: action.payload.outline }, state.workflow);
             return { ...state, isStreaming: false, streamingSource: null, documents: newDocuments };
        }
        case 'END_STREAMING_CONTENT': {
            const { nodeId, content, sources } = action.payload;
            const newDocuments = upsertDocument(state.documents, { nodeId, content, sources }, state.workflow);
            const doc = newDocuments.find(d => d.nodeId === nodeId)!;
            const newHistory = { ...state.history, [nodeId]: [...(state.history[nodeId] || []), doc] };
            return { ...state, isStreaming: false, streamingSource: null, documents: newDocuments, history: newHistory };
        }
        case 'SET_WORKFLOW_STATUS':
            return { ...state, workflowStatus: action.payload.status };
        case 'SET_USER_FEEDBACK': {
             const { nodeId, feedback } = action.payload;
             const newFeedbackHistory = {...state.feedbackHistory, [nodeId]: [...(state.feedbackHistory[nodeId] || []), feedback]};
            return { ...state, feedbackHistory: newFeedbackHistory, userFeedback: { ...state.userFeedback, [nodeId]: feedback } };
        }
        case 'ADD_CHAT_MESSAGE': {
            const { nodeId, message } = action.payload;
            const newDocs = state.documents.map(d => {
                if (d.nodeId === nodeId) {
                    return {...d, chatHistory: [...d.chatHistory, message]};
                }
                return d;
            });
            return {...state, documents: newDocs};
        }
        case 'END_CHAT_STREAM': {
            const { nodeId, fullResponse } = action.payload;
            const newDocs = state.documents.map(d => {
                if (d.nodeId === nodeId) {
                    const newHistory = [...d.chatHistory];
                    if(newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'model') {
                        newHistory[newHistory.length - 1].content = fullResponse;
                    }
                    return {...d, chatHistory: newHistory};
                }
                return d;
            });
            return {...state, documents: newDocs, isStreaming: false, streamingSource: null};
        }
        default:
            return state;
    }
}

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'CREATE_PROJECT': {
            const lang = detectLanguage(action.payload.description);
            const initialGraph = lang === 'vi' ? VIETNAMESE_WORKFLOW_GRAPH : INITIAL_WORKFLOW_GRAPH;
            const newProject: ProjectState = {
                ...initialProjectState,
                id: `proj_${Date.now()}`,
                description: action.payload.description,
                language: lang,
                workflow: initialGraph,
            };
            return {
                ...state,
                projects: [...state.projects, newProject],
                activeProjectId: newProject.id,
            };
        }
        case 'SELECT_PROJECT':
            return { ...state, activeProjectId: action.payload.projectId };
        case 'DELETE_PROJECT':
            return {
                ...state,
                projects: state.projects.filter(p => p.id !== action.payload.projectId),
                activeProjectId: state.activeProjectId === action.payload.projectId ? null : state.activeProjectId,
            };
        case 'DISPATCH_TO_PROJECT':
            return {
                ...state,
                projects: state.projects.map(p =>
                    p.id === action.payload.projectId ? projectReducer(p, action.payload.action) : p
                ),
            };
        default:
            return state;
    }
}


const App: React.FC = () => {
    const [storedState, setStoredState] = useLocalStorage<AppState>('appState_v2', { projects: [], activeProjectId: null });
    const [state, dispatch] = useReducer(appReducer, storedState);
    const [viewMode, setViewMode] = useState<'workflow' | 'explorer' | 'tester'>('workflow');
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    
    // API Key Management State
    const [apiKey, setApiKey] = useLocalStorage<string>('gemini_api_key', '');
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

    const geminiService = useMemo(() => {
        if (apiKey) {
            try {
                return new GeminiService(apiKey);
            } catch (e) {
                console.error("Failed to initialize Gemini Service", e);
                // Clear the invalid key and re-open the modal.
                setApiKey(''); 
                setIsApiKeyModalOpen(true);
                return null;
            }
        }
        return null;
    }, [apiKey, setApiKey]);

    // Check for API key on initial load
    useEffect(() => {
        if (!apiKey) {
            setIsApiKeyModalOpen(true);
        }
    }, [apiKey]);

    useEffect(() => {
        setStoredState(state);
    }, [state, setStoredState]);

    const activeProject = useMemo(() => state.projects.find(p => p.id === state.activeProjectId), [state.projects, state.activeProjectId]);
    
    const t = locales[activeProject?.language || 'en'];

    const dispatchToProject = useCallback((action: ProjectAction) => {
        if (state.activeProjectId) {
            dispatch({ type: 'DISPATCH_TO_PROJECT', payload: { projectId: state.activeProjectId, action } });
        }
    }, [state.activeProjectId]);

    const findNode = (nodeId: string): GraphNode | undefined => activeProject?.workflow.nodes.find(n => n.id === nodeId);
    
    const getPredecessorOutputs = (nodeId: string, contentOnly = false): Record<string, string> => {
        if (!activeProject) return {};
        const predecessors = activeProject.workflow.edges.filter(e => e.target === nodeId).map(e => e.source);
        const outputs: Record<string, string> = {};
        predecessors.forEach(pId => {
            const doc = activeProject.documents.find(d => d.nodeId === pId);
            if (doc) {
                outputs[pId] = contentOnly ? doc.content : (doc.content || doc.synthesis || '');
            }
        });
        return outputs;
    };
    
    const runNode = useCallback(async (nodeId: string) => {
        if (!activeProject || !geminiService) {
            if (!geminiService) setIsApiKeyModalOpen(true);
            return;
        }
        const node = findNode(nodeId);
        if (!node) return;

        try {
            if (node.nodeType === NodeType.SYNTHESIS) {
                dispatchToProject({ type: 'UPDATE_NODE_STATUS', payload: { nodeId, status: NodeStatus.SYNTHESIZING } });
                dispatchToProject({ type: 'START_STREAMING', payload: { nodeId, source: 'synthesis' } });
                const prevOutputs = getPredecessorOutputs(nodeId);
                const prompt = node.synthesisPrompt!(activeProject.description, prevOutputs, activeProject.language);
                const content = await geminiService.streamGenerator(prompt, (c) => dispatchToProject({ type: 'APPEND_STREAMING_CONTENT', payload: { chunk: c } }));
                dispatchToProject({ type: 'END_STREAMING_SYNTHESIS', payload: { nodeId, content }});
                dispatchToProject({ type: 'UPDATE_NODE_STATUS', payload: { nodeId, status: NodeStatus.COMPLETED }});
                return;
            }
            
            const synthesisInput = activeProject.documents.find(d => d.nodeId === activeProject.workflow.edges.find(e=>e.target === nodeId)?.source)?.content || getPredecessorOutputs(nodeId, true)['n1'] || '';

            if (node.outlinePrompt) {
                dispatchToProject({ type: 'UPDATE_NODE_STATUS', payload: { nodeId, status: NodeStatus.GENERATING_OUTLINE } });
                dispatchToProject({ type: 'START_STREAMING', payload: { nodeId, source: 'outline' } });
                const prompt = node.outlinePrompt(activeProject.description, synthesisInput, activeProject.language);
                const outline = await geminiService.streamGenerator(prompt, (c) => dispatchToProject({ type: 'APPEND_STREAMING_CONTENT', payload: { chunk: c } }));
                dispatchToProject({ type: 'END_STREAMING_OUTLINE', payload: { nodeId, outline } });
                dispatchToProject({ type: 'UPDATE_NODE_STATUS', payload: { nodeId, status: NodeStatus.AWAITING_OUTLINE_REVIEW } });
                dispatchToProject({ type: 'SET_WORKFLOW_STATUS', payload: { status: WorkflowStatus.PAUSED } });
            } 
            else if (node.taskPrompt) {
                dispatchToProject({ type: 'UPDATE_NODE_STATUS', payload: { nodeId, status: NodeStatus.GENERATING_CONTENT } });
                dispatchToProject({ type: 'START_STREAMING', payload: { nodeId, source: 'content' } });
                const prompt = node.taskPrompt(activeProject.description, synthesisInput, '', activeProject.language);
                const content = await geminiService.streamGenerator(prompt, (c) => dispatchToProject({ type: 'APPEND_STREAMING_CONTENT', payload: { chunk: c } }));
                dispatchToProject({ type: 'END_STREAMING_CONTENT', payload: { nodeId, content }});
                dispatchToProject({ type: 'UPDATE_NODE_STATUS', payload: { nodeId, status: NodeStatus.COMPLETED }});
            }
        } catch(error) {
            console.error("Workflow failed at node:", nodeId, error);
            dispatchToProject({type: 'UPDATE_NODE_STATUS', payload: { nodeId: nodeId, status: NodeStatus.FAILED }});
            dispatchToProject({type: 'SET_WORKFLOW_STATUS', payload: { status: WorkflowStatus.FAILED }});
        }
    }, [activeProject, dispatchToProject, geminiService]);

    const handleApproval = useCallback(async (nodeId: string, stage: 'outline' | 'content') => {
        if (!activeProject || !geminiService) {
            if (!geminiService) setIsApiKeyModalOpen(true);
            return;
        }
        const node = findNode(nodeId);
        if (!node) return;

        try {
            if (stage === 'outline') {
                dispatchToProject({ type: 'UPDATE_NODE_STATUS', payload: { nodeId, status: NodeStatus.GENERATING_CONTENT } });
                dispatchToProject({ type: 'START_STREAMING', payload: { nodeId, source: 'content' } });
                const doc = activeProject.documents.find(d => d.nodeId === nodeId);
                const synthesisInput = activeProject.documents.find(d => d.nodeId === activeProject.workflow.edges.find(e=>e.target === nodeId)?.source)?.content || getPredecessorOutputs(nodeId, true)['n1'] || '';

                const prompt = node.taskPrompt!(activeProject.description, synthesisInput, doc?.outline || '', activeProject.language);
                let fullText = '';
                let sources: {uri: string; title: string}[] | undefined;

                if (node.useSearch) {
                    const result = await geminiService.generateWithSearch(prompt);
                    fullText = result.text;
                    sources = result.sources;
                    dispatchToProject({ type: 'APPEND_STREAMING_CONTENT', payload: { chunk: fullText } });
                } else {
                    fullText = await geminiService.streamGenerator(prompt, (c) => dispatchToProject({ type: 'APPEND_STREAMING_CONTENT', payload: { chunk: c }}));
                }
                dispatchToProject({ type: 'END_STREAMING_CONTENT', payload: { nodeId, content: fullText, sources }});
                
                if (node.isHumanInLoop) {
                    dispatchToProject({ type: 'UPDATE_NODE_STATUS', payload: { nodeId, status: NodeStatus.AWAITING_REVIEW } });
                    dispatchToProject({ type: 'SET_WORKFLOW_STATUS', payload: { status: WorkflowStatus.PAUSED } });
                } else {
                    dispatchToProject({ type: 'UPDATE_NODE_STATUS', payload: { nodeId, status: NodeStatus.COMPLETED } });
                    dispatchToProject({ type: 'SET_WORKFLOW_STATUS', payload: { status: WorkflowStatus.RUNNING } });
                }
            } else {
                dispatchToProject({ type: 'UPDATE_NODE_STATUS', payload: { nodeId, status: NodeStatus.COMPLETED } });
                dispatchToProject({ type: 'SET_WORKFLOW_STATUS', payload: { status: WorkflowStatus.RUNNING } });
            }
        } catch(error) {
            console.error("Workflow failed at node:", nodeId, error);
            dispatchToProject({type: 'UPDATE_NODE_STATUS', payload: { nodeId: nodeId, status: NodeStatus.FAILED }});
            dispatchToProject({type: 'SET_WORKFLOW_STATUS', payload: { status: WorkflowStatus.FAILED }});
        }
    }, [activeProject, dispatchToProject, geminiService]);

    const handleRejection = useCallback(async (nodeId: string, stage: 'outline' | 'content', feedback: string) => {
        if (!activeProject || !geminiService) {
            if (!geminiService) setIsApiKeyModalOpen(true);
            return;
        }
        const node = findNode(nodeId);
        if (!node || !node.refinePrompt) return;
        
        try {
            dispatchToProject({ type: 'SET_USER_FEEDBACK', payload: { nodeId, feedback } });
            dispatchToProject({ type: 'UPDATE_NODE_STATUS', payload: { nodeId, status: NodeStatus.REFINING } });
            
            const doc = activeProject.documents.find(d => d.nodeId === nodeId);
            const artifactToRefine = stage === 'outline' ? doc?.outline : doc?.content;
            const taskForRefinement = stage === 'outline' ? 'Refine the outline.' : 'Refine the document content.';

            if (!artifactToRefine) return;

            dispatchToProject({ type: 'START_STREAMING', payload: { nodeId, source: stage } });
            const prompt = node.refinePrompt(taskForRefinement, artifactToRefine, feedback, activeProject.language);
            const refinedArtifact = await geminiService.streamGenerator(prompt, (c) => dispatchToProject({ type: 'APPEND_STREAMING_CONTENT', payload: { chunk: c }}));

            if (stage === 'outline') {
                dispatchToProject({ type: 'END_STREAMING_OUTLINE', payload: { nodeId, outline: refinedArtifact } });
                dispatchToProject({ type: 'UPDATE_NODE_STATUS', payload: { nodeId, status: NodeStatus.AWAITING_OUTLINE_REVIEW } });
            } else {
                dispatchToProject({ type: 'END_STREAMING_CONTENT', payload: { nodeId, content: refinedArtifact } });
                dispatchToProject({ type: 'UPDATE_NODE_STATUS', payload: { nodeId, status: NodeStatus.AWAITING_REVIEW } });
            }
            dispatchToProject({ type: 'SET_WORKFLOW_STATUS', payload: { status: WorkflowStatus.PAUSED } });
        } catch(error) {
            console.error("Workflow failed at node:", nodeId, error);
            dispatchToProject({type: 'UPDATE_NODE_STATUS', payload: { nodeId: nodeId, status: NodeStatus.FAILED }});
            dispatchToProject({type: 'SET_WORKFLOW_STATUS', payload: { status: WorkflowStatus.FAILED }});
        }
    }, [activeProject, dispatchToProject, geminiService]);

    const advanceWorkflow = useCallback(() => {
        if (!activeProject || activeProject.workflowStatus !== WorkflowStatus.RUNNING) return;

        const nextNode = activeProject.workflow.nodes.find(node => {
            if (node.status !== NodeStatus.PENDING) return false;
            const predecessors = activeProject.workflow.edges.filter(e => e.target === node.id).map(e => e.source);
            if (predecessors.length === 0) return node.id === activeProject.workflow.nodes[0].id;
            return predecessors.every(pId => findNode(pId)?.status === NodeStatus.COMPLETED);
        });

        if (nextNode) {
            runNode(nextNode.id);
        } else if (activeProject.workflow.nodes.every(n => n.status === NodeStatus.COMPLETED || n.status === NodeStatus.SKIPPED)) {
            dispatchToProject({ type: 'SET_WORKFLOW_STATUS', payload: { status: WorkflowStatus.COMPLETED } });
        }
    }, [activeProject, runNode, dispatchToProject]);

    useEffect(() => {
        if (activeProject && activeProject.workflowStatus === WorkflowStatus.IDLE) {
            dispatchToProject({ type: 'START_WORKFLOW', payload: { description: activeProject.description } });
        }
        advanceWorkflow();
    }, [activeProject, activeProject?.workflow, activeProject?.workflowStatus, advanceWorkflow, dispatchToProject]);

    const handleCreateProject = (description: string) => {
        dispatch({ type: 'CREATE_PROJECT', payload: { description } });
        setIsCreatingProject(false);
    };

    const handleReset = () => {
        if (window.confirm(t.resetConfirmation)) {
             dispatchToProject({ type: 'RESET_WORKFLOW' });
        }
    };
    
    const handleSetActiveNode = (nodeId: string | null) => {
        dispatchToProject({ type: 'SET_ACTIVE_NODE', payload: { nodeId } });
    };

    const handleSimulateEdgeCase = (scenario: string) => {
        if (!activeProject) return;
        if (scenario === 'logicalError') {
            const runningNode = activeProject.workflow.nodes.find(n => n.status !== NodeStatus.PENDING && n.status !== NodeStatus.COMPLETED);
            if(runningNode) {
                dispatchToProject({type: 'UPDATE_NODE_STATUS', payload: { nodeId: runningNode.id, status: NodeStatus.FAILED }});
                dispatchToProject({type: 'SET_WORKFLOW_STATUS', payload: { status: WorkflowStatus.FAILED }});
                alert(t.alertFailure.replace('{nodeLabel}', runningNode.label));
            } else {
                alert(t.alertNoActiveNode)
            }
        }
    };
    
    const handleSendMessage = useCallback(async (nodeId: string, message: string) => {
        if (!activeProject || !geminiService) {
            if (!geminiService) setIsApiKeyModalOpen(true);
            return;
        }
        const node = findNode(nodeId);
        const doc = activeProject.documents.find(d => d.nodeId === nodeId);
        if (!node || !doc) return;

        try {
            dispatchToProject({ type: 'ADD_CHAT_MESSAGE', payload: { nodeId, message: { role: 'user', content: message } } });
            dispatchToProject({ type: 'START_STREAMING', payload: { nodeId, source: 'chat' } });

            const parentEdges = activeProject.workflow.edges.filter(e => e.target === nodeId);
            const parentIds = parentEdges.map(e => e.source);
            const siblingIds = activeProject.workflow.edges
                .filter(e => parentIds.includes(e.source) && e.target !== nodeId)
                .map(e => e.target);

            const getDocContent = (id: string) => activeProject.documents.find(d => d.nodeId === id)?.content || '';

            const context = `
CONTEXT:
Project Description: "${activeProject.description}"

Current Document ("${doc.title}"):
---
${doc.content}
---

${parentIds.length > 0 ? 'Parent Document(s) Context:' : ''}
${parentIds.map(id => `--- Document: "${findNode(id)?.label}" ---\n${getDocContent(id)}`).join('\n\n')}

${siblingIds.length > 0 ? 'Sibling Document(s) Context:' : ''}
${siblingIds.map(id => `--- Document: "${findNode(id)?.label}" ---\n${getDocContent(id)}`).join('\n\n')}

Based on ALL of the context above, answer the following question about the "${doc.title}" document.
The response must be in ${activeProject.language === 'vi' ? 'Vietnamese' : 'English'}.

Question: "${message}"
`;
            dispatchToProject({ type: 'ADD_CHAT_MESSAGE', payload: { nodeId, message: { role: 'model', content: '' } } });
            const fullResponse = await geminiService.streamChatResponse(context, (c) => dispatchToProject({ type: 'APPEND_STREAMING_CONTENT', payload: { chunk: c }}));
            dispatchToProject({ type: 'END_CHAT_STREAM', payload: { nodeId, fullResponse } });
        } catch(error) {
             console.error("Chat failed for node:", nodeId, error);
             // Optionally add an error message to the chat history
        }

    }, [activeProject, dispatchToProject, geminiService]);
    
    const activeNode = activeProject?.activeNodeId ? findNode(activeProject.activeNodeId) : null;
    const activeDocument = activeProject?.documents.find(d => d.nodeId === activeProject.activeNodeId) || null;

    const handleSaveApiKey = (key: string) => {
        setApiKey(key);
        setIsApiKeyModalOpen(false);
    };

    const renderWorkspace = () => {
        if (!activeProject) return null;
        
        return (
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-200 truncate pr-4" title={activeProject.description}>{activeProject.description}</h2>
                    <div className="flex items-center gap-2 p-1 bg-slate-800 rounded-lg">
                        <button onClick={() => setViewMode('workflow')} className={`px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-2 ${viewMode === 'workflow' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}><NetworkIcon />{t.workflowView}</button>
                        <button onClick={() => setViewMode('explorer')} className={`px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-2 ${viewMode === 'explorer' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}><LayoutGridIcon />{t.explorerView}</button>
                    </div>
                </div>

                {viewMode === 'workflow' && (
                    <div className="h-[calc(100vh-12rem)]">
                        <ResizableLayout
                            leftPanel={
                                <EnhancedWorkflowVisualizer 
                                    nodes={activeProject.workflow.nodes} 
                                    edges={activeProject.workflow.edges}
                                    activeNodeId={activeProject.activeNodeId}
                                    onNodeClick={handleSetActiveNode}
                                    t={t}
                                    className="h-full"
                                />
                            }
                            rightPanel={
                                <div className="h-full flex flex-col gap-4 p-4">
                                    <EdgeCaseSimulator 
                                        onSimulate={handleSimulateEdgeCase} 
                                        isWorkflowRunning={activeProject.workflowStatus === WorkflowStatus.RUNNING} 
                                        t={t}
                                    />
                                    {activeNode && (
                                        <div className="flex-1 overflow-hidden">
                                            <EnhancedDocumentViewer 
                                                geminiService={geminiService} 
    geminiService={geminiService} 
                                                node={activeNode}
                                                document={activeDocument}
                                                streamingContent={activeProject.streamingContent}
                                                streamingSource={activeProject.streamingSource}
                                                isStreaming={activeProject.isStreaming}
                                                onApprove={handleApproval}
                                                onReject={handleRejection}
                                                t={t}
                                                className="h-full"
                                            />
                                        </div>
                                    )}
                                </div>
                            }
                            defaultLeftWidth={70}
                            minLeftWidth={60}
                            maxLeftWidth={80}
                        />
                    </div>
                )}
                {viewMode === 'explorer' && (
                    <div className="h-[calc(100vh-12rem)]">
                        <ResizableLayout
                            leftPanel={
                                <EnhancedDocumentExplorer 
                                    nodes={activeProject.workflow.nodes}
                                    edges={activeProject.workflow.edges}
                                    onSelectNode={handleSetActiveNode}
                                    activeNodeId={activeProject.activeNodeId}
                                    t={t}
                                    className="h-full"
                                />
                            }
                            rightPanel={
                                <div className="h-full flex flex-col">
                                    <div className="flex-1 overflow-hidden">
                                        <EnhancedDocumentManager 
                                            nodes={activeProject.workflow.nodes}
                                            onSelectNode={handleSetActiveNode}
                                            t={t}
                                            className="h-full"
                                        />
                                    </div>
                                </div>
                            }
                            bottomPanel={
                                activeNode && (
                                    <EnhancedDocumentViewer 
                                        node={activeNode}
                                        document={activeDocument}
                                        streamingContent={activeProject.streamingContent}
                                        streamingSource={activeProject.streamingSource}
                                        isStreaming={activeProject.isStreaming}
                                        onApprove={handleApproval}
                                        onReject={handleRejection}
                                        t={t}
                                        className="h-full"
                                    />
                                )
                            }
                            defaultLeftWidth={40}
                            minLeftWidth={30}
                            maxLeftWidth={60}
                            defaultBottomHeight={40}
                            minBottomHeight={30}
                            maxBottomHeight={60}
                        />
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        if (!state.activeProjectId) {
            if (isCreatingProject) {
                return <ProjectInput onStartProject={handleCreateProject} onCancel={() => setIsCreatingProject(false)} isLoading={false} t={locales['en']} />;
            }
            return <ProjectManager
                projects={state.projects}
                onSelectProject={(projectId) => dispatch({ type: 'SELECT_PROJECT', payload: { projectId } })}
                onCreateProject={() => setIsCreatingProject(true)}
                onDeleteProject={(projectId) => {
                    if (window.confirm(t.deleteProjectConfirmation)) {
                        dispatch({ type: 'DELETE_PROJECT', payload: { projectId } });
                    }
                }}
                t={t}
            />;
        }
        return renderWorkspace();
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans pt-20">
            <Header
                onBackToProjects={() => {
                  dispatch({ type: 'SELECT_PROJECT', payload: { projectId: null } });
                  setIsCreatingProject(false);
                }}
                activeProjectId={state.activeProjectId}
                onReset={activeProject?.workflowStatus !== WorkflowStatus.IDLE ? handleReset : undefined}
                t={t} 
                onOpenSettings={() => setIsApiKeyModalOpen(true)}
            />
            {isApiKeyModalOpen && (
                <ApiKeyModal 
                    onSave={handleSaveApiKey}
                    t={t}
                    initialKey={apiKey}
                />
            )}
            <main className={`p-4 transition-all duration-300 ${!geminiService ? 'blur-sm pointer-events-none' : ''}`}>
                {renderContent()}
            </main>
        </div>
    );
};

export default App;