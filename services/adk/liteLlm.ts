
import { BaseLlm, LlmRequest, LlmResponse } from '@google/adk';
import { Content, Part } from '@google/genai';

/**
 * Interface for LiteLLM compatible chat completion request
 */
interface OpenAIRequest {
    model: string;
    messages: OpenAIMessage[];
    temperature?: number;
    stream?: boolean;
}

interface OpenAIMessage {
    role: string;
    content: string | OpenAIContentPart[];
}

interface OpenAIContentPart {
    type: "text" | "image_url";
    text?: string;
    image_url?: {
        url: string;
    };
}

interface OpenAIResponse {
    choices: {
        message: {
            content: string;
            role: string;
        };
        finish_reason: string;
    }[];
}

/**
 * LiteLlm implementation for ADK JS.
 * Connects to a LiteLLM proxy or OpenAI compatible endpoint.
 */
export class LiteLlm extends BaseLlm {
    private baseUrl: string;
    private apiKey: string;

    constructor(params: { model: string, baseUrl?: string, apiKey?: string }) {
        super({ model: params.model });
        this.baseUrl = params.baseUrl || 'http://localhost:4000/v1'; // Default LiteLLM proxy
        this.apiKey = params.apiKey || 'sk-1234'; // Default dummy key for local LiteLLM
    }

    // Implementing abstract methods from BaseLlm
    connect(llmRequest: LlmRequest): Promise<any> {
        throw new Error('Method not implemented.');
    }

    async *generateContentAsync(llmRequest: LlmRequest, stream?: boolean): AsyncGenerator<LlmResponse, void, unknown> {
        // Convert LlmRequest to OpenAI format
        const messages: OpenAIMessage[] = [];

        // Add system instruction if present
        if (llmRequest.config?.systemInstruction) {
             let sysText = "";
             const instruction = llmRequest.config.systemInstruction;

             if (typeof instruction === 'string') {
                 sysText = instruction;
             } else if (this.isContent(instruction)) {
                 if (instruction.parts) {
                     sysText = instruction.parts.map(p => p.text || "").join('\n');
                 }
             } else if (Array.isArray(instruction)) {
                 // It's PartUnion[]
                 sysText = instruction.map(p => typeof p === 'string' ? p : p.text || "").join('\n');
             } else if (this.isPart(instruction)) {
                 // It's Part
                 sysText = instruction.text || "";
             }

             if (sysText) {
                 messages.push({
                     role: 'system',
                     content: sysText
                 });
             }
        }

        // Convert contents
        for (const content of llmRequest.contents) {
            const role = content.role === 'model' ? 'assistant' : (content.role || 'user');

            if (content.parts && content.parts.length > 0) {
                 const parts: OpenAIContentPart[] = [];
                 for (const part of content.parts) {
                     if (part.text) {
                         parts.push({ type: 'text', text: part.text });
                     } else if (part.inlineData) {
                         // Convert inlineData to data URL
                         const mimeType = part.inlineData.mimeType;
                         const data = part.inlineData.data;
                         parts.push({
                             type: 'image_url',
                             image_url: {
                                 url: `data:${mimeType};base64,${data}`
                             }
                         });
                     }
                 }
                 messages.push({
                     role: role,
                     content: parts
                 });
            }
        }

        const requestBody: OpenAIRequest = {
            model: this.model,
            messages: messages,
            temperature: llmRequest.config?.temperature,
            stream: false // For simplicity, we don't stream yet as generateSummary awaits full text
        };

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`LiteLLM request failed: ${response.statusText} - ${errorText}`);
            }

            const data: OpenAIResponse = await response.json();
            const choice = data.choices[0];
            const content = choice.message.content;

            const llmResponse: LlmResponse = {
                content: {
                    role: 'model',
                    parts: [{ text: content }]
                },
                finishReason: choice.finish_reason as any
            };

            yield llmResponse;

        } catch (error: any) {
            console.error("LiteLLM Error:", error);
            // Yield an error response
             const errorResponse: LlmResponse = {
                errorCode: 'LiteLLM_Error',
                errorMessage: error.message
            };
            yield errorResponse;
        }
    }

    private isContent(obj: any): obj is Content {
        return typeof obj === 'object' && obj !== null && ('parts' in obj || 'role' in obj);
    }

    private isPart(obj: any): obj is Part {
        return typeof obj === 'object' && obj !== null && ('text' in obj || 'inlineData' in obj);
    }
}
