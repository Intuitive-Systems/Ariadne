import { ChatCompletionRequestMessage } from "openai";
import { SitePageChunkResult, WebsiteIndex, WebsiteIndexI, createSearchTerms, getKeyword, openaiChatCompletion, rewriteQuery } from "../../src";
import fs from "fs";
import MiniSearch from "minisearch";

async function main() {
    const path = __dirname + "/../indices/slough.gov.uk.index.json";
    const savedIndex: WebsiteIndexI = JSON.parse(fs.readFileSync(path).toString());
    const query =  "What is flytipping even tho bruv?" ;

    // full text search over chunks


    // embedding search
    const index = WebsiteIndex.fromJSON(savedIndex);
    const hypAnswer = await rewriteQuery(query);
    console.log(`Hypothetical Answer: ${hypAnswer}`)
    const similarityResults = await index.fullTextSearch(query, 3)
    const keyword = await getKeyword(query);
    console.log(`Keyword: ${keyword}`);
    const keywordResults: SitePageChunkResult[] = await index.keywordSearch(keyword.toLowerCase(), 7);

    const instructions: ChatCompletionRequestMessage = {
        role: "system",
        content: `You are an assistant for the Slough Borough Council website. You talk with a cockney accent.
        You help residents answer questions they might have using information from the website.
        You are given a query and details from the council website and formulate a response to the query.
        You NEVER make up links. You only use links from the search results.
        `
    }
    const thoughts: ChatCompletionRequestMessage[] = [
        {
            role: "assistant",
            content: `I found these pages that contain the keyword "${keyword}".
            Chunks:\n${keywordResults.map(r => `Link: ${r.url}\nContent: ${r.content}`).join('\n---\n')}`
        }
        
    ]
    const prompt: ChatCompletionRequestMessage = {
        role: "user",
        content: `User:\n${query}`  
    }
    const payload = [instructions, ...thoughts, prompt];
    
    console.log(`Payload: ${JSON.stringify(payload, null, 2)}`)
    // call openai to answer the question
    const response = await openaiChatCompletion(payload, 600, 0.5, "gpt-4");
    // print out the response
    console.log(`Question: ${query}\nAnswer: ${response}`);
}

(async () => {
    main();
})();