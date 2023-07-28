import { ChatCompletionRequestMessage, CreateCompletionResponse } from 'openai';
export declare function _openaiCompletion(prompt: string, nTokens?: number, temperature?: number, model?: string): Promise<CreateCompletionResponse>;
export declare const openaiCompletion: typeof _openaiCompletion;
declare function _openaiChatCompletion(messages: ChatCompletionRequestMessage[], maxTokens?: number, temperature?: number, model?: string): Promise<string>;
export declare const openaiChatCompletion: typeof _openaiChatCompletion;
export declare function openaiEmbedding(document: string): Promise<import("openai").CreateEmbeddingResponse>;
export {};
