import React, { useState, useCallback, useEffect } from 'react';
import { Document, Language, GraphNode, NodeStatus } from '../types';
import { EnhancedAiService, OutlineGenerationResult, KnowledgeSynthesisResult, HumanFeedbackRequest } from '../services/enhancedAiService';
import { EnhancedDocumentService } from '../services/enhancedDocumentService';

interface HumanFeedbackWorkflowProps {
  projectDescription: string;
  relatedDocuments: Document[];
  language: Language;
  apiKey: string;
  onDocumentGenerated: (document: Document) => void;
  onWorkflowUpdate: (status: string, progress: number) => void;
  className?: string;
  t: any; // Translation object
}

type WorkflowStage = 
  | 'idle'
  | 'synthesizing_knowledge'
  | 'generating_outline'
  | 'awaiting_outline_approval'
  | 'generating_content'
  | 'awaiting_content_approval'
  | 'completed'
  | 'error';

interface WorkflowState {
  stage: WorkflowStage;
  progress: number;
  synthesisResult?: KnowledgeSynthesisResult;
  outlineResult?: OutlineGenerationResult;
  generatedContent?: string;
  feedbackRequest?: HumanFeedbackRequest;
  error?: string;
}

const HumanFeedbackWorkflow: React.FC<HumanFeedbackWorkflowProps> = ({
  projectDescription,
  relatedDocuments,
  language,
  apiKey,
  onDocumentGenerated,
  onWorkflowUpdate,
  className = '',
  t
}) => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    stage: 'idle',
    progress: 0
  });
  const [aiService, setAiService] = useState<EnhancedAiService | null>(null);
  const [userFeedback, setUserFeedback] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // Initialize AI service
  useEffect(() => {
    if (apiKey) {
      try {
        const service = new EnhancedAiService(apiKey, "gemini-2.5-pro");
        setAiService(service);
      } catch (error) {
        console.error("Failed to initialize AI service:", error);
        setWorkflowState(prev => ({
          ...prev,
          stage: 'error',
          error: 'Failed to initialize AI service'
        }));
      }
    }
  }, [apiKey]);

  // Update parent component when workflow state changes
  useEffect(() => {
    onWorkflowUpdate(workflowState.stage, workflowState.progress);
  }, [workflowState.stage, workflowState.progress, onWorkflowUpdate]);

  // Stage 1: Knowledge Synthesis
  const startKnowledgeSynthesis = useCallback(async () => {
    if (!aiService) return;

    setWorkflowState(prev => ({
      ...prev,
      stage: 'synthesizing_knowledge',
      progress: 10
    }));

    try {
      const synthesisResult = await aiService.synthesizeKnowledge(
        relatedDocuments,
        projectDescription,
        language
      );

      setWorkflowState(prev => ({
        ...prev,
        stage: 'generating_outline',
        progress: 30,
        synthesisResult
      }));

      // Automatically proceed to outline generation
      generateOutline(synthesisResult);
    } catch (error) {
      setWorkflowState(prev => ({
        ...prev,
        stage: 'error',
        error: `Knowledge synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, [aiService, relatedDocuments, projectDescription, language]);

  // Stage 2: Outline Generation
  const generateOutline = useCallback(async (synthesisResult: KnowledgeSynthesisResult) => {
    if (!aiService) return;

    try {
      const outlineResult = await aiService.generateOutlineWithFeedback(
        projectDescription,
        synthesisResult.synthesizedKnowledge,
        language
      );

      const feedbackRequest = aiService.generateFeedbackRequest(
        'outline_review',
        outlineResult.outline,
        [
          'Review the structure and completeness',
          'Check if all important topics are covered',
          'Verify the logical flow and organization',
          'Suggest any missing sections or improvements'
        ]
      );

      setWorkflowState(prev => ({
        ...prev,
        stage: 'awaiting_outline_approval',
        progress: 50,
        outlineResult,
        feedbackRequest
      }));
    } catch (error) {
      setWorkflowState(prev => ({
        ...prev,
        stage: 'error',
        error: `Outline generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, [aiService, projectDescription, language]);

  // Handle outline approval/feedback
  const handleOutlineApproval = useCallback(async (approved: boolean) => {
    if (!aiService || !workflowState.outlineResult || !workflowState.synthesisResult) return;

    if (approved) {
      // Proceed to content generation
      setWorkflowState(prev => ({
        ...prev,
        stage: 'generating_content',
        progress: 70
      }));

      try {
        setIsStreaming(true);
        setStreamingContent('');

        const generatedContent = await aiService.generateContentFromOutline(
          projectDescription,
          workflowState.outlineResult.outline,
          workflowState.synthesisResult.synthesizedKnowledge,
          language,
          (chunk: string) => {
            setStreamingContent(prev => prev + chunk);
          }
        );

        const contentFeedbackRequest = aiService.generateFeedbackRequest(
          'content_review',
          generatedContent,
          [
            'Review content quality and accuracy',
            'Check for completeness and clarity',
            'Verify code examples and technical details',
            'Suggest improvements or corrections'
          ]
        );

        setWorkflowState(prev => ({
          ...prev,
          stage: 'awaiting_content_approval',
          progress: 90,
          generatedContent,
          feedbackRequest: contentFeedbackRequest
        }));

        setIsStreaming(false);
        setStreamingContent('');
      } catch (error) {
        setWorkflowState(prev => ({
          ...prev,
          stage: 'error',
          error: `Content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }));
        setIsStreaming(false);
      }
    } else {
      // Process feedback and regenerate outline
      if (userFeedback.trim()) {
        try {
          const revisedOutline = await aiService.processHumanFeedback(
            workflowState.outlineResult.outline,
            userFeedback,
            'outline',
            language
          );

          const updatedOutlineResult = {
            ...workflowState.outlineResult,
            outline: revisedOutline
          };

          const feedbackRequest = aiService.generateFeedbackRequest(
            'outline_review',
            revisedOutline,
            ['Review the revised outline based on your feedback']
          );

          setWorkflowState(prev => ({
            ...prev,
            outlineResult: updatedOutlineResult,
            feedbackRequest
          }));

          setUserFeedback('');
        } catch (error) {
          setWorkflowState(prev => ({
            ...prev,
            stage: 'error',
            error: `Outline revision failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }));
        }
      }
    }
  }, [aiService, workflowState.outlineResult, workflowState.synthesisResult, projectDescription, language, userFeedback]);

  // Handle content approval/feedback
  const handleContentApproval = useCallback(async (approved: boolean) => {
    if (!aiService || !workflowState.generatedContent) return;

    if (approved) {
      // Create final document
      const finalDocument: Document = {
        id: `doc-${Date.now()}`,
        nodeId: `node-${Date.now()}`,
        title: projectDescription.substring(0, 50) + (projectDescription.length > 50 ? '...' : ''),
        synthesis: workflowState.synthesisResult?.synthesizedKnowledge || '',
        outline: workflowState.outlineResult?.outline || '',
        content: workflowState.generatedContent,
        sources: workflowState.synthesisResult?.relevantSources.map(source => ({
          uri: source,
          title: source
        })) || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        chatHistory: [],
        metadata: EnhancedDocumentService.calculateDocumentMetadata(
          workflowState.generatedContent,
          projectDescription
        ),
        parentDocumentId: undefined,
        childDocumentIds: [],
        relatedDocumentIds: relatedDocuments.map(d => d.id),
        tags: ['ai-generated', 'workflow-approved'],
        category: 'Generated Content',
        priority: 'medium',
        isApproved: true,
        approvalStage: 'approved'
      };

      setWorkflowState(prev => ({
        ...prev,
        stage: 'completed',
        progress: 100
      }));

      onDocumentGenerated(finalDocument);
    } else {
      // Process feedback and regenerate content
      if (userFeedback.trim()) {
        try {
          setIsStreaming(true);
          setStreamingContent('');

          const revisedContent = await aiService.processHumanFeedback(
            workflowState.generatedContent,
            userFeedback,
            'content',
            language
          );

          const contentFeedbackRequest = aiService.generateFeedbackRequest(
            'content_review',
            revisedContent,
            ['Review the revised content based on your feedback']
          );

          setWorkflowState(prev => ({
            ...prev,
            generatedContent: revisedContent,
            feedbackRequest: contentFeedbackRequest
          }));

          setUserFeedback('');
          setIsStreaming(false);
        } catch (error) {
          setWorkflowState(prev => ({
            ...prev,
            stage: 'error',
            error: `Content revision failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }));
          setIsStreaming(false);
        }
      }
    }
  }, [aiService, workflowState.generatedContent, workflowState.synthesisResult, workflowState.outlineResult, projectDescription, relatedDocuments, language, userFeedback, onDocumentGenerated]);

  // Reset workflow
  const resetWorkflow = useCallback(() => {
    setWorkflowState({
      stage: 'idle',
      progress: 0
    });
    setUserFeedback('');
    setStreamingContent('');
    setIsStreaming(false);
  }, []);

  // Render workflow progress
  const renderProgress = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Workflow Progress
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {workflowState.progress}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${workflowState.progress}%` }}
        />
      </div>
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {workflowState.stage === 'idle' && 'Ready to start'}
        {workflowState.stage === 'synthesizing_knowledge' && 'Synthesizing knowledge from related documents...'}
        {workflowState.stage === 'generating_outline' && 'Generating comprehensive outline...'}
        {workflowState.stage === 'awaiting_outline_approval' && 'Awaiting human approval for outline'}
        {workflowState.stage === 'generating_content' && 'Generating detailed content...'}
        {workflowState.stage === 'awaiting_content_approval' && 'Awaiting human approval for content'}
        {workflowState.stage === 'completed' && 'Workflow completed successfully!'}
        {workflowState.stage === 'error' && 'Error occurred during workflow'}
      </div>
    </div>
  );

  // Render knowledge synthesis results
  const renderSynthesisResults = () => {
    if (!workflowState.synthesisResult) return null;

    return (
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          📚 Knowledge Synthesis Results
        </h4>
        <div className="space-y-2 text-sm">
          <div>
            <strong>Key Insights:</strong>
            <ul className="list-disc list-inside mt-1 text-blue-800 dark:text-blue-200">
              {workflowState.synthesisResult.keyInsights.map((insight, index) => (
                <li key={index}>{insight}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Relevant Sources:</strong> {workflowState.synthesisResult.relevantSources.join(', ')}
          </div>
        </div>
      </div>
    );
  };

  // Render outline approval interface
  const renderOutlineApproval = () => {
    if (workflowState.stage !== 'awaiting_outline_approval' || !workflowState.outlineResult) return null;

    return (
      <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-4">
          📋 Outline Review Required
        </h4>
        
        <div className="mb-4 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Estimated Complexity: <span className="font-medium">{workflowState.outlineResult.estimatedComplexity}</span> |
            Estimated Time: <span className="font-medium">{workflowState.outlineResult.estimatedTimeMinutes} minutes</span>
          </div>
          <div className="whitespace-pre-wrap text-sm">{workflowState.outlineResult.outline}</div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Feedback (optional):
          </label>
          <textarea
            value={userFeedback}
            onChange={(e) => setUserFeedback(e.target.value)}
            placeholder="Provide feedback for outline improvements..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => handleOutlineApproval(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            ✅ Approve Outline
          </button>
          <button
            onClick={() => handleOutlineApproval(false)}
            disabled={!userFeedback.trim()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🔄 Request Revision
          </button>
        </div>
      </div>
    );
  };

  // Render content approval interface
  const renderContentApproval = () => {
    if (workflowState.stage !== 'awaiting_content_approval' || !workflowState.generatedContent) return null;

    return (
      <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-4">
          📄 Content Review Required
        </h4>
        
        <div className="mb-4 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg max-h-96 overflow-y-auto">
          <div className="whitespace-pre-wrap text-sm">{workflowState.generatedContent}</div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Feedback (optional):
          </label>
          <textarea
            value={userFeedback}
            onChange={(e) => setUserFeedback(e.target.value)}
            placeholder="Provide feedback for content improvements..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => handleContentApproval(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            ✅ Approve Content
          </button>
          <button
            onClick={() => handleContentApproval(false)}
            disabled={!userFeedback.trim()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🔄 Request Revision
          </button>
        </div>
      </div>
    );
  };

  // Render streaming content
  const renderStreamingContent = () => {
    if (!isStreaming || !streamingContent) return null;

    return (
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
          <div className="animate-pulse mr-2">⚡</div>
          Generating Content...
        </h4>
        <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 max-h-64 overflow-y-auto">
          {streamingContent}
        </div>
      </div>
    );
  };

  return (
    <div className={`${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          🤖 AI-Powered Document Generation Workflow
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Advanced agentic workflow with human-in-the-loop validation
        </p>
      </div>

      {renderProgress()}
      {renderSynthesisResults()}
      {renderOutlineApproval()}
      {renderStreamingContent()}
      {renderContentApproval()}

      {workflowState.stage === 'idle' && (
        <div className="text-center">
          <button
            onClick={startKnowledgeSynthesis}
            disabled={!aiService}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🚀 Start AI Workflow
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Project: {projectDescription}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Using {relatedDocuments.length} related documents for context
          </p>
        </div>
      )}

      {workflowState.stage === 'completed' && (
        <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
          <div className="text-4xl mb-2">🎉</div>
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
            Workflow Completed Successfully!
          </h4>
          <p className="text-sm text-green-700 dark:text-green-300 mb-4">
            Your document has been generated and approved through the human-in-the-loop process.
          </p>
          <button
            onClick={resetWorkflow}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            🔄 Start New Workflow
          </button>
        </div>
      )}

      {workflowState.stage === 'error' && (
        <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="text-4xl mb-2">❌</div>
          <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
            Workflow Error
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            {workflowState.error}
          </p>
          <button
            onClick={resetWorkflow}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            🔄 Retry Workflow
          </button>
        </div>
      )}
    </div>
  );
};

export default HumanFeedbackWorkflow;
