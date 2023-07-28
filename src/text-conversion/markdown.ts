import { ChatCompletionRequestMessage } from "openai";
import { openaiChatCompletion } from "../openai/openai";

export async function text2Markdown(text: string): Promise<string> {
    // take text and use openai to convert to markdown
    const prompt: ChatCompletionRequestMessage = {
        role: "user",
        content: `Convert the following text to markdown, optimizing for readability:\n\n${text}\n\nMarkdown:`
    }
    const response = await openaiChatCompletion([prompt], 3000, 0.2, "gpt-3.5-turbo-16k");
    return response
}


