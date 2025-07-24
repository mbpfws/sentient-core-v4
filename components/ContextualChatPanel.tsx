import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Document, ChatMessage } from '../types';
import { EnhancedAiService } from '../services/enhancedAiService';
import { EnhancedDocumentService } from '../services/enhancedDocumentService';

interface ContextualChatPanelProps {
  document: Document;
  allDocuments: Document[];
  apiKey: string;
  onChatUpdate?: (chatHistory: ChatMessage[]) => void;
  className?: string;
  t: any; // Translation object
}

const ContextualChatPanel: React.FC<ContextualChatPanelProps> = ({
  document,
  allDocuments,
  apiKey,
  onChatUpdate,
  className = '',
  t
}) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(document.chatHistory || []);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [relatedDocuments, setRelatedDocuments] = useState<Document[]>([]);
  const [showRelatedDocs, setShowRelatedDocs] = useState(false);
  const [aiService, setAiService] = useState<EnhancedAiService | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize AI service
  useEffect(() => {
    if (apiKey) {
      try {
        const service = new EnhancedAiService(apiKey, "gemini-2.5-flash");
        setAiService(service);
      } catch (error) {
        console.error("Failed to initialize AI service:", error);
      }
    }
  }, [apiKey]);

  // Get related documents
  useEffect(() => {
    const related = EnhancedDocumentService.getRelatedDocuments(document, allDocuments, 5);
    setRelatedDocuments(related);
  }, [document, allDocuments]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, streamingContent]);

  // Update parent component when chat history changes
  useEffect(() => {
    if (onChatUpdate) {
      onChatUpdate(chatHistory);
    }
  }, [chatHistory, onChatUpdate]);

  const handleSendMessage = useCallback(async () => {
    if (!currentMessage.trim() || !aiService || isStreaming) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage.trim()
    };

    // Add user message to chat
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setCurrentMessage('');
    setIsStreaming(true);
    setStreamingContent('');

    try {
      // Generate contextual response
      const response = await aiService.generateContextualChatResponse(
        userMessage.content,
        document,
        relatedDocuments,
        updatedHistory,
        (chunk: string) => {
          setStreamingContent(prev => prev + chunk);
        }
      );

      // Add AI response to chat
      const aiMessage: ChatMessage = {
        role: 'model',
        content: response
      };

      setChatHistory(prev => [...prev, aiMessage]);
      setStreamingContent('');
    } catch (error) {
      console.error("Error generating chat response:", error);
      const errorMessage: ChatMessage = {
        role: 'model',
        content: 'I apologize, but I encountered an error processing your request. Please try again.'
      };
      setChatHistory(prev => [...prev, errorMessage]);
      setStreamingContent('');
    } finally {
      setIsStreaming(false);
    }
  }, [currentMessage, aiService, isStreaming, chatHistory, document, relatedDocuments]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const clearChat = useCallback(() => {
    setChatHistory([]);
    setStreamingContent('');
  }, []);

  const renderMessage = (message: ChatMessage, index: number) => (
    <div
      key={index}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          message.role === 'user'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
        }`}
      >
        <div className="text-sm font-medium mb-1">
          {message.role === 'user' ? 'You' : 'AI Assistant'}
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );

  const renderStreamingMessage = () => {
    if (!streamingContent) return null;

    return (
      <div className="flex justify-start mb-4">
        <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
          <div className="text-sm font-medium mb-1">AI Assistant</div>
          <div className="whitespace-pre-wrap">{streamingContent}</div>
          <div className="flex items-center mt-2">
            <div className="animate-pulse flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <span className="ml-2 text-xs text-gray-500">Generating response...</span>
          </div>
        </div>
      </div>
    );
  };

  const renderRelatedDocuments = () => (
    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
      <button
        onClick={() => setShowRelatedDocs(!showRelatedDocs)}
        className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
      >
        <span>Related Documents ({relatedDocuments.length})</span>
        <span className="transform transition-transform duration-200" style={{
          transform: showRelatedDocs ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </span>
      </button>
      
      {showRelatedDocs && (
        <div className="mt-2 space-y-2">
          {relatedDocuments.map(relatedDoc => (
            <div
              key={relatedDoc.id}
              className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {relatedDoc.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {relatedDoc.category} • {relatedDoc.metadata.wordCount} words
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDocumentContext = () => (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-blue-600 dark:text-blue-400">📄</span>
        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
          Discussing: {document.title}
        </span>
      </div>
      <div className="text-xs text-blue-700 dark:text-blue-300">
        Category: {document.category} • Priority: {document.priority} • 
        {document.metadata.wordCount} words • {document.metadata.estimatedReadTime} min read
      </div>
    </div>
  );

  if (!apiKey) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">🔑</div>
          <div>API key required for contextual chat</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-2">
          <span className="text-lg">💬</span>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t.contextualChat || 'Contextual Chat'}
          </h3>
        </div>
        <button
          onClick={clearChat}
          className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          title="Clear Chat"
        >
          🗑️
        </button>
      </div>

      {/* Document Context */}
      <div className="p-4">
        {renderDocumentContext()}
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <div className="text-4xl mb-2">💭</div>
            <div>Ask me anything about this document!</div>
            <div className="text-sm mt-2">
              I have access to the full document content and {relatedDocuments.length} related documents.
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map(renderMessage)}
            {renderStreamingMessage()}
          </>
        )}
      </div>

      {/* Related Documents */}
      {relatedDocuments.length > 0 && (
        <div className="p-4">
          {renderRelatedDocuments()}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-600 p-4">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t.askAboutDocument || "Ask about this document..."}
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={isStreaming}
          />
          <button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isStreaming}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isStreaming ? '⏳' : '📤'}
          </button>
        </div>
        
        {isStreaming && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <div className="animate-spin mr-2">⚡</div>
            Generating contextual response using large context window...
          </div>
        )}
      </div>
    </div>
  );
};

export default ContextualChatPanel;
