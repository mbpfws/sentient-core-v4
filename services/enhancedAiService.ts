import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Document, Language, GraphNode } from '../types';

export interface OutlineGenerationResult {
  outline: string;
  estimatedComplexity: 'simple' | 'moderate' | 'complex' | 'expert';
  estimatedTimeMinutes: number;
  suggestedApproach: string;
}

export interface KnowledgeSynthesisResult {
  synthesizedKnowledge: string;
  relevantSources: string[];
  keyInsights: string[];
  contextualPrompt: string;
}

export interface HumanFeedbackRequest {
  type: 'outline_review' | 'content_review' | 'synthesis_review';
  content: string;
  suggestions?: string[];
  requiredApproval: boolean;
}

export class EnhancedAiService {
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = "gemini-2.5-pro") {
    if (!apiKey) {
      throw new Error("API key is required to initialize EnhancedAiService.");
    }
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  /**
   * Advanced prompt amplification with dynamic information retrieval
   */
  async amplifyPrompt(basePrompt: string, context: {
    relatedDocuments?: Document[];
    projectDescription?: string;
    targetAudience?: string;
    technicalLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }): Promise<string> {
    const amplificationPrompt = `
You are an expert prompt engineer. Enhance the following base prompt with:
1. Dynamic information retrieval context
2. Chain-of-thought reasoning structure
3. Grounding techniques for accuracy
4. Latest 2025 technology considerations

Base Prompt: ${basePrompt}

Context:
- Project: ${context.projectDescription || 'Not specified'}
- Target Audience: ${context.targetAudience || 'General'}
- Technical Level: ${context.technicalLevel || 'intermediate'}
- Related Documents: ${context.relatedDocuments?.length || 0} available

Please return an enhanced prompt that incorporates advanced RAG strategies and contextual grounding.
`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: amplificationPrompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      });

      return response.text || basePrompt;
    } catch (error) {
      console.error("Error amplifying prompt:", error);
      return basePrompt;
    }
  }

  /**
   * Knowledge synthesis from related documents
   */
  async synthesizeKnowledge(
    relatedDocuments: Document[],
    targetContext: string,
    language: Language = 'en'
  ): Promise<KnowledgeSynthesisResult> {
    if (relatedDocuments.length === 0) {
      return {
        synthesizedKnowledge: '',
        relevantSources: [],
        keyInsights: [],
        contextualPrompt: targetContext
      };
    }

    const synthesisPrompt = `
You are an expert knowledge synthesizer. Analyze the following related documents and synthesize key knowledge relevant to: "${targetContext}"

Documents to analyze:
${relatedDocuments.map((doc, index) => `
Document ${index + 1}: ${doc.title}
Content: ${doc.content.substring(0, 1000)}...
Category: ${doc.category}
Priority: ${doc.priority}
`).join('\n')}

Please provide:
1. Synthesized Knowledge: A comprehensive synthesis of relevant information
2. Key Insights: 3-5 most important insights from the documents
3. Relevant Sources: Which documents are most relevant and why
4. Contextual Prompt Enhancement: How this knowledge should inform the target context

Language: ${language === 'vi' ? 'Vietnamese' : 'English'}

Format your response as JSON with the structure:
{
  "synthesizedKnowledge": "...",
  "keyInsights": ["...", "..."],
  "relevantSources": ["...", "..."],
  "contextualPrompt": "..."
}
`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: synthesisPrompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 3000
        }
      });

      const result = JSON.parse(response.text || '{}');
      return {
        synthesizedKnowledge: result.synthesizedKnowledge || '',
        relevantSources: result.relevantSources || [],
        keyInsights: result.keyInsights || [],
        contextualPrompt: result.contextualPrompt || targetContext
      };
    } catch (error) {
      console.error("Error synthesizing knowledge:", error);
      return {
        synthesizedKnowledge: 'Error synthesizing knowledge from related documents.',
        relevantSources: relatedDocuments.map(d => d.title),
        keyInsights: [],
        contextualPrompt: targetContext
      };
    }
  }

  /**
   * Generate comprehensive outline with human feedback loop
   */
  async generateOutlineWithFeedback(
    projectDescription: string,
    synthesizedKnowledge: string,
    language: Language = 'en'
  ): Promise<OutlineGenerationResult> {
    const outlinePrompt = `
You are an expert technical writer and project architect. Generate a comprehensive outline for: "${projectDescription}"

Synthesized Knowledge Context:
${synthesizedKnowledge}

Requirements:
1. Create a detailed, hierarchical outline
2. Include estimated complexity and time requirements
3. Suggest the best approach for implementation
4. Consider latest 2025 technology trends and best practices
5. Structure for easy human review and feedback

Language: ${language === 'vi' ? 'Vietnamese' : 'English'}

Format your response as JSON:
{
  "outline": "Detailed hierarchical outline with H1, H2, H3 structure",
  "estimatedComplexity": "simple|moderate|complex|expert",
  "estimatedTimeMinutes": number,
  "suggestedApproach": "Recommended approach and methodology"
}
`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: outlinePrompt,
        config: {
          temperature: 0.4,
          maxOutputTokens: 4000
        }
      });

      const result = JSON.parse(response.text || '{}');
      return {
        outline: result.outline || 'Error generating outline',
        estimatedComplexity: result.estimatedComplexity || 'moderate',
        estimatedTimeMinutes: result.estimatedTimeMinutes || 30,
        suggestedApproach: result.suggestedApproach || 'Standard approach'
      };
    } catch (error) {
      console.error("Error generating outline:", error);
      return {
        outline: 'Error generating outline. Please try again.',
        estimatedComplexity: 'moderate',
        estimatedTimeMinutes: 30,
        suggestedApproach: 'Standard approach with manual review'
      };
    }
  }

  /**
   * Generate content based on approved outline
   */
  async generateContentFromOutline(
    projectDescription: string,
    approvedOutline: string,
    synthesizedKnowledge: string,
    language: Language = 'en',
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const contentPrompt = `
You are an expert technical writer. Generate comprehensive, high-quality content based on the approved outline.

Project: ${projectDescription}

Approved Outline:
${approvedOutline}

Synthesized Knowledge Context:
${synthesizedKnowledge}

Requirements:
1. Follow the approved outline structure exactly
2. Generate detailed, actionable content
3. Include code examples where appropriate
4. Use latest 2025 best practices and technologies
5. Ensure content is immediately executable and practical
6. Include proper markdown formatting
7. Add relevant diagrams in Mermaid format where helpful

Language: ${language === 'vi' ? 'Vietnamese' : 'English'}

Generate comprehensive content that meets AI-optimized documentation standards:
- Structured and modular design
- Detailed, actionable, and executable content
- Machine-readable formats with rich metadata
- Clear human feedback checkpoints
`;

    try {
      if (onChunk) {
        // Streaming generation
        const response = await this.ai.models.generateContentStream({
          model: this.model,
          contents: contentPrompt,
          config: {
            temperature: 0.3,
            maxOutputTokens: 8000
          }
        });

        let fullContent = "";
        for await (const chunk of response) {
          const text = chunk.text;
          if (text) {
            fullContent += text;
            onChunk(text);
          }
        }
        return fullContent;
      } else {
        // Non-streaming generation
        const response = await this.ai.models.generateContent({
          model: this.model,
          contents: contentPrompt,
          config: {
            temperature: 0.3,
            maxOutputTokens: 8000
          }
        });

        return response.text || 'Error generating content';
      }
    } catch (error) {
      console.error("Error generating content:", error);
      const errorMsg = `Error generating content: ${error instanceof Error ? error.message : 'Unknown error'}`;
      if (onChunk) onChunk(errorMsg);
      return errorMsg;
    }
  }

  /**
   * Contextual chat for document discussions
   */
  async generateContextualChatResponse(
    userMessage: string,
    document: Document,
    relatedDocuments: Document[],
    chatHistory: Array<{role: 'user' | 'model', content: string}>,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const contextualPrompt = `
You are an expert AI assistant with deep knowledge of the document context. Respond to the user's question with full awareness of the document content and related materials.

Current Document: ${document.title}
Document Content: ${document.content}
Category: ${document.category}
Priority: ${document.priority}

Related Documents Context:
${relatedDocuments.map(doc => `- ${doc.title}: ${doc.content.substring(0, 200)}...`).join('\n')}

Chat History:
${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User Question: ${userMessage}

Please provide a helpful, contextual response that:
1. Directly addresses the user's question
2. References relevant parts of the current document
3. Draws connections to related documents when appropriate
4. Provides actionable insights and suggestions
5. Maintains conversation context from chat history

Use the large context window of gemini-2.5-flash to provide comprehensive, contextually aware responses.
`;

    try {
      if (onChunk) {
        const response = await this.ai.models.generateContentStream({
          model: "gemini-2.5-flash", // Use flash model for chat due to large context window
          contents: contextualPrompt,
          config: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        });

        let fullResponse = "";
        for await (const chunk of response) {
          const text = chunk.text;
          if (text) {
            fullResponse += text;
            onChunk(text);
          }
        }
        return fullResponse;
      } else {
        const response = await this.ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contextualPrompt,
          config: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        });

        return response.text || 'I apologize, but I encountered an error processing your request.';
      }
    } catch (error) {
      console.error("Error generating contextual chat response:", error);
      const errorMsg = `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      if (onChunk) onChunk(errorMsg);
      return errorMsg;
    }
  }

  /**
   * Intelligent Mermaid error correction
   */
  async correctMermaidSyntax(
    problematicMermaid: string,
    errorMessage: string,
    surroundingContext: string
  ): Promise<string> {
    const correctionPrompt = `
You are an expert in Mermaid diagram syntax. Fix the following Mermaid code that is causing rendering errors.

Problematic Mermaid Code:
\`\`\`mermaid
${problematicMermaid}
\`\`\`

Error Message: ${errorMessage}

Surrounding Context: ${surroundingContext}

Please provide the corrected Mermaid code that:
1. Fixes the syntax error
2. Maintains the original intent and structure
3. Follows Mermaid best practices
4. Is guaranteed to render correctly

Return only the corrected Mermaid code without additional explanation.
`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: correctionPrompt,
        config: {
          temperature: 0.1, // Low temperature for precise syntax correction
          maxOutputTokens: 1000
        }
      });

      return response.text?.replace(/```mermaid\n?|\n?```/g, '').trim() || problematicMermaid;
    } catch (error) {
      console.error("Error correcting Mermaid syntax:", error);
      return problematicMermaid; // Return original if correction fails
    }
  }

  /**
   * Generate human feedback request
   */
  generateFeedbackRequest(
    type: 'outline_review' | 'content_review' | 'synthesis_review',
    content: string,
    suggestions: string[] = []
  ): HumanFeedbackRequest {
    return {
      type,
      content,
      suggestions,
      requiredApproval: true
    };
  }

  /**
   * Process human feedback and regenerate content
   */
  async processHumanFeedback(
    originalContent: string,
    feedback: string,
    feedbackType: 'outline' | 'content' | 'synthesis',
    language: Language = 'en'
  ): Promise<string> {
    const feedbackPrompt = `
You are an expert content editor. Revise the following ${feedbackType} based on human feedback.

Original ${feedbackType}:
${originalContent}

Human Feedback: ${feedback}

Please provide a revised version that:
1. Addresses all feedback points
2. Maintains the original structure where appropriate
3. Improves quality and clarity
4. Incorporates suggestions effectively

Language: ${language === 'vi' ? 'Vietnamese' : 'English'}

Return the revised ${feedbackType}:
`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: feedbackPrompt,
        config: {
          temperature: 0.4,
          maxOutputTokens: 4000
        }
      });

      return response.text || originalContent;
    } catch (error) {
      console.error("Error processing human feedback:", error);
      return originalContent;
    }
  }
}
