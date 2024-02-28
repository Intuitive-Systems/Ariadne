import { Command } from 'commander';
import { DocumentIndex, extractPdf, openaiChatCompletion } from ".";
import { ChatCompletionRequestMessage } from "openai";
import fs from "fs";

const program = new Command();

program
  .version('1.0.0')
  .command('embed')
  .requiredOption('-d, --docPath <path>', 'Path to document')
  .requiredOption('-i, --indexPath <path>', 'Path to save index')
  .action(async (options) => {
    await embed(options.docPath, options.indexPath);
  });

program
  .command('qa')
  .requiredOption('-i, --indexPath <path>', 'Path to saved index')
  .requiredOption('-q, --query <query>', 'Query string')
  .action(async (options) => {
    await questionAnswer(options.indexPath, options.query);
  });

async function embed(docPath, indexPath) {
    console.log(`Extracting PDF from ${docPath}`);
    const pages = await extractPdf(docPath);
    console.log(`Extracted ${pages.length} pages from PDF`);
    const index = await DocumentIndex.fromRecords(pages);

    const indexJson = index.toJSON();
    const indexFileName = docPath.split('/').pop().split('.').shift() + ".index.json";
    const outputPath = `${indexPath}/${indexFileName}`;
    fs.writeFileSync(outputPath, JSON.stringify(indexJson, null, 2));
    console.log(`Successfully saved index to ${outputPath}`);
}

async function questionAnswer(indexPath, query) {
    const savedIndex = JSON.parse(fs.readFileSync(indexPath).toString());
    const index = DocumentIndex.fromJSON(savedIndex);
    const results = await index.query(query, 3);

    const instructions: ChatCompletionRequestMessage = {
        role: "system",
        content: `You are a literary assistant who helps people find information in books.
        You are given a query and details from a document and formulate a response to the query.
        Citations are in markdown link format at the bottom as footnotes: [description](page number)
        `
    }
    // create individual thoughts for each result
    const thoughts: ChatCompletionRequestMessage[] = results.map(r => ({
        role: "assistant",
        content: `Hmm I found this part of the document that is similar to the user's query.
        Page ${r.pageNumber}, Content: ${r.content}`
    }));
    const prompt: ChatCompletionRequestMessage = {
        role: "user",
        content: `User:\n${query}`  
    }
    const payload = [instructions, ...thoughts, prompt];
    console.log(`Sending ${payload.length} messages to OpenAI\n${JSON.stringify(payload, null, 2)}`)
    // call openai to answer the question
    const response = await openaiChatCompletion(payload, 600, 0.5, "gpt-3.5-turbo");
    // print out the response
    console.log(`Question: ${query}\nAnswer: ${response}`);
}

program.parse(process.argv);