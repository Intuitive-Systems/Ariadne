import { ChatCompletionRequestMessage } from "openai";
import { openaiChatCompletion } from "./openai";

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