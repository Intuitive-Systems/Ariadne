import retry from "async-retry"
import {ChatCompletionRequestMessage, Configuration, CreateCompletionResponse, OpenAIApi} from 'openai';
import { config } from "../config";
import { inspect } from 'util';
import { TIKTOKEN_MODEL, numTokens } from "../tokenization/tokenizer";
import {traceFunction} from "../trace";

const openai = config.openai;

/*
    This function is used to generate text using the OpenAI API.
    The text is generated based on the prompt provided.
    The prompt is a string that contains the text to be used as a starting point for the generation.
    Example:
    prompt: "I am a student"
    output: "I am a student at the University of California, Berkeley."

    @param prompt: string - The text to be used as a starting point for the generation
    @param nTokens: number - The number of tokens to be generated
    @param temperature: number - The temperature of the model
    @param model: string - The model to be used for generation
    @return string - The generated text
*/
export async function _openaiCompletion(prompt: string, nTokens: number = 500, temperature: number = 1, model: string = "text-davinci-003"): Promise<CreateCompletionResponse> {
    // estimate token usage
    const document = prompt;
    const usage = await numTokens(document, model as TIKTOKEN_MODEL);
    const response = await retry(
        async () => {
            const result = await openai.createCompletion({
                model: model,
                prompt,
                temperature: temperature,
                max_tokens: nTokens,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0, 
                logprobs: 1
            });

            if (result.status !== 200) {
                console.error('Error: Received non-200 status code from OpenAI API:');
                console.error(`Status code: ${result.status}`);
                throw new Error(`Request failed with status code ${result.status} while completing prompt`);
            }

            return result;
        },
        {
            retries: 8,
            factor: 4,
            minTimeout: 1000,
            onRetry: (error: any, attempt) => {
                console.error(`Error while completing prompt (attempt ${attempt}): ${error.message}}`);
            }
        }
    );

    return response.data
}
export const openaiCompletion = traceFunction(_openaiCompletion);

async function _openaiChatCompletion(messages: ChatCompletionRequestMessage[], maxTokens: number = 500, temperature: number = 1, model: string = "gpt-3.5-turbo"): Promise<string> {
    // estimate token usage
    const document = messages.map(m => m.content).join("\n");
    const nTokens = await numTokens(document, model as TIKTOKEN_MODEL);
    const response = await retry(
        async () => {
            const result = await openai.createChatCompletion({
                model: model,
                messages,
                temperature: temperature,
                max_tokens: maxTokens,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0
            });
            return result;
        },
        {
            retries: 12,
            factor: 5,
            minTimeout: 4000,
            onRetry: (error: any, attempt) => {
                console.error(`Error while completing prompt (attempt ${attempt}): ${error.response.data.error.message}}`);
            }
        }
    );
    return response.data.choices[0].message!.content!.trim();
}
export const openaiChatCompletion = traceFunction(_openaiChatCompletion);


export async function openaiEmbedding(document: string) {
    const response = await retry(
        async () => {
            const result = await openai.createEmbedding({
                model: "text-embedding-ada-002",
                input: document
            });
            return result;
        },
        {
            retries: 8,
            factor: 4,
            minTimeout: 1000,
            onRetry: (error: any, attempt) => {
                console.error(`Error while fetching embeddings (attempt ${attempt}): ${error.message}}`);
            }
        }
    );
    return response.data;
}