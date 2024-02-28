import { ChatCompletionRequestMessage } from "openai";
import { openaiChatCompletion } from "./openai";

// a method that takes a query and returns a single keyword
// that is likely to return relevant urls that might answer the query
export async function getKeyword(query: string, maxTokens: number = 20, model: string = "gpt-3.5-turbo"): Promise<string> {
    const prompt: ChatCompletionRequestMessage[] = [
        {
            role: "system",
            content: `Given a user query, the most general single word that is likely to return relevant urls that might answer the query.`
        },
        {
            role: "user",
            content: `User Query: ${query}\nKeyword:`
        }
    ]
    const response = await openaiChatCompletion(prompt, maxTokens, 0.8, model);
    return response.toLowerCase().trim();
}

// a method that takes a query and returns better query
// that is more likely to return relevant cosine similarity results
export async function rewriteQuery(query: string, maxTokens: number = 100, model: string = "gpt-3.5-turbo"): Promise<string> {
    const prompt: ChatCompletionRequestMessage[] = [
        {
            role: "system",
            content: `Given a user query, invent some search results from the website and return an excerpt from the results that has the answer to the user's query.`
        },
        {
            role: "user",
            content: `User Query: ${query}\nHypothetical Answer:`
        }
    ]
    const response = await openaiChatCompletion(prompt, maxTokens, 0.8, model);
    return response.toLowerCase().trim();
}

export async function createSearchTerms(query: string, maxTokens: number = 25, model: string = "gpt-4"): Promise<string> {
    const prompt: ChatCompletionRequestMessage[] = [
        {
            role: "system",
            content: `Given a user query, write a search term of max 4 words designed to find helpful results in full text search. Never include quotation marks.`
        },
        {
            role: "user",
            content: `User Query: ${query}\nSearch Terms:`
        }
    ]
    const response = await openaiChatCompletion(prompt, maxTokens, 0.2, model);
    return response.toLowerCase().trim();
}