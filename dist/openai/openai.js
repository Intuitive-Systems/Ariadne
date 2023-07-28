"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openaiEmbedding = exports.openaiChatCompletion = exports.openaiCompletion = exports._openaiCompletion = void 0;
const async_retry_1 = __importDefault(require("async-retry"));
const openai_1 = require("openai");
const config_1 = require("../config");
const tokenizer_1 = require("../tokenization/tokenizer");
const trace_1 = require("../trace");
const configuration = new openai_1.Configuration({
    apiKey: config_1.config.openai_api_key
});
const openai = new openai_1.OpenAIApi(configuration);
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
async function _openaiCompletion(prompt, nTokens = 500, temperature = 1, model = "text-davinci-003") {
    // estimate token usage
    const document = prompt;
    const usage = await (0, tokenizer_1.numTokens)(document, model);
    const response = await (0, async_retry_1.default)(async () => {
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
    }, {
        retries: 8,
        factor: 4,
        minTimeout: 1000,
        onRetry: (error, attempt) => {
            console.error(`Error while completing prompt (attempt ${attempt}): ${error.message}}`);
        }
    });
    return response.data;
}
exports._openaiCompletion = _openaiCompletion;
exports.openaiCompletion = (0, trace_1.traceFunction)(_openaiCompletion);
async function _openaiChatCompletion(messages, maxTokens = 500, temperature = 1, model = "gpt-3.5-turbo") {
    // estimate token usage
    const document = messages.map(m => m.content).join("\n");
    const nTokens = await (0, tokenizer_1.numTokens)(document, model);
    const response = await (0, async_retry_1.default)(async () => {
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
    }, {
        retries: 12,
        factor: 5,
        minTimeout: 4000,
        onRetry: (error, attempt) => {
            console.error(`Error while completing prompt (attempt ${attempt}): ${error.response.data.error.message}}`);
        }
    });
    return response.data.choices[0].message.content.trim();
}
exports.openaiChatCompletion = (0, trace_1.traceFunction)(_openaiChatCompletion);
async function openaiEmbedding(document) {
    const response = await (0, async_retry_1.default)(async () => {
        const result = await openai.createEmbedding({
            model: "text-embedding-ada-002",
            input: document
        });
        return result;
    }, {
        retries: 8,
        factor: 4,
        minTimeout: 1000,
        onRetry: (error, attempt) => {
            console.error(`Error while fetching embeddings (attempt ${attempt}): ${error.message}}`);
        }
    });
    return response.data;
}
exports.openaiEmbedding = openaiEmbedding;
