"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.text2Markdown = void 0;
const openai_1 = require("../openai/openai");
async function text2Markdown(text) {
    // take text and use openai to convert to markdown
    const prompt = {
        role: "user",
        content: `Convert the following text to markdown, optimizing for readability:\n\n${text}\n\nMarkdown:`
    };
    const response = await (0, openai_1.openaiChatCompletion)([prompt], 3000, 0.2, "gpt-3.5-turbo-16k");
    return response;
}
exports.text2Markdown = text2Markdown;
