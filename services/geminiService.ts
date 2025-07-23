import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export class GeminiService {
    private ai: GoogleGenAI;

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error("API key is required to initialize GeminiService.");
        }
        this.ai = new GoogleGenAI({ apiKey });
    }

    async streamGenerator(prompt: string, onChunk: (chunk: string) => void): Promise<string> {
        try {
            const response = await this.ai.models.generateContentStream({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    thinkingConfig: { thinkingBudget: 0 }
                }
            });
            
            let fullText = "";
            for await (const chunk of response) {
                const text = chunk.text;
                if (text) {
                    fullText += text;
                    onChunk(text);
                }
            }
            return fullText;

        } catch (error) {
            console.error("Error in streamGenerator:", error);
            const errorMessage = `\n\n**Error:** An error occurred while generating content. Please check the API key and console for details.`;
            onChunk(errorMessage);
            throw error;
        }
    };

    async streamChatResponse(prompt: string, onChunk: (chunk: string) => void): Promise<string> {
        try {
            const response = await this.ai.models.generateContentStream({
                model: "gemini-2.5-flash",
                contents: prompt,
                 config: {
                    thinkingConfig: { thinkingBudget: 0 }
                }
            });

            let fullText = "";
            for await (const chunk of response) {
                const text = chunk.text;
                if (text) {
                    fullText += text;
                    onChunk(text);
                }
            }
            return fullText;
        } catch (error) {
            console.error("Error in streamChatResponse:", error);
            const errorMsg = `\n\n**Error:** An error occurred while generating the chat response. Please check the API key and console for details.`;
            onChunk(errorMsg);
            throw error;
        }
    };


    async generateWithSearch(prompt: string): Promise<{ text: string; sources: { uri: string; title: string; }[] }> {
        try {
            const response = await this.ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });

            const text = response.text;
            const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            
            const sources = rawChunks
                .map(chunk => chunk.web)
                .filter(web => web && web.uri)
                .map(web => ({ uri: web!.uri!, title: web!.title || web!.uri! }));

            // Deduplicate sources based on URI
            const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());
            
            return { text, sources: uniqueSources };
        } catch (error) {
            console.error("Error in generateWithSearch:", error);
            return {
                text: `**Error:** An error occurred while generating content with search. Please check the API key and console for details.`,
                sources: []
            };
        }
    };
}
