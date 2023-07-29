import { ChatCompletionRequestMessage } from "openai";
import { DocumentIndex, openaiChatCompletion } from "../src";
import fs from "fs";
const documentPath =  __dirname + "/documents/theseus-minotaur.pdf";

async function main() {
    const savedIndex = JSON.parse(fs.readFileSync(__dirname + "/indices/theseus-minotaur.index.json").toString());
    const index = DocumentIndex.fromJSON(savedIndex);
    const query = "Who is Ariadne?";
    const results = await index.query(query, 3);

    const instructions: ChatCompletionRequestMessage = {
        role: "system",
        content: `You are a literary assistant who helps people find information in books.
        You are given a query and details from a document and formulate a response to the query.
        `
    }
    const thoughts: ChatCompletionRequestMessage = {
        role: "assistant",
        content: `Hmm I found these parts of the document that are similar to the user's query.
        Chunks:\n${results.map(r => `Page ${r.page}, Content: ${r.content}`).join('\n')}`
    }
    const prompt: ChatCompletionRequestMessage = {
        role: "user",
        content: `User:\n${query}`  
    }
    const payload = [instructions, thoughts, prompt];
    
    // call openai to answer the question
    const response = await openaiChatCompletion(payload, 600, 0.5, "gpt-3.5-turbo");
    // print out the response
    console.log(`Question: ${query}\nAnswer: ${response}`);}

(async () => {
    main();
})();