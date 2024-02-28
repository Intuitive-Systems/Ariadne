import { existsSync, promises as fs } from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';
import { Page } from '../indices/DocumentIndex';
import { v4 as uuidv4 } from 'uuid';
import { openaiChatCompletion } from '../openai';
import { ChatCompletionRequestMessage } from 'openai'
import { outdent } from 'outdent';

export async function getPageNumberFromText(text: string): Promise<string> {
  // grab the last 200 characters of the text
  let pageText = text.slice(-50);
  const systemPrompt: ChatCompletionRequestMessage = {
    role: "system",
    content: outdent`
    You are given the last 50 characters of a page of text from a book. 
    You are asked to find the page number of the text.
    Page numbers can be numbers, roman numerals, or words. 
    If there is not enough information to identify the page, return -1.
    Example Page Numbers: 
    8
    xiii 
    eight
    `
  }

  const examplePrompts: ChatCompletionRequestMessage[] = [
    {
      role: "user",
      content: outdent`
      Text: 
      \n\n\nForeword II   |   xxi
      Page number:
      xxi`
    },
    {
      role: "user",
      content: outdent`
      Text: 
      \n4    |   Chapter 1: How SRE Relates to DevOps
      Page number:
      4`
    },
    {
      role: "user",
      content: outdent`
      Text: 
      A Worked Example   |   27
      Page number:
      27`
    }
  ]
  const prompt: ChatCompletionRequestMessage = {
    role: "user",
    content: outdent`
    Text: ${pageText}
    Page number:`
  }
  console.log(`Sending prompt to OpenAI\n${JSON.stringify(prompt, null, 2)}`)
  const response = await openaiChatCompletion([systemPrompt,...examplePrompts,prompt], 10, 0.5, "gpt-3.5-turbo");
  return response;
}

export async function extractPdf(PDFPath: string): Promise<Page[]> {
  if (!existsSync(PDFPath)) {
    throw new Error(`PDF file does not exist: ${PDFPath}`);
  }

  const execAsync = promisify(exec);
  const command = `pdftotext -layout`;

  // Get the total number of pages
  const totalPagesCommand = `pdfinfo ${PDFPath} | awk '/Pages:/ {print $2}'`;
  const { stdout: totalPages } = await execAsync(totalPagesCommand);

  const pages: Page[] = [];

  for (let i = 1; i <= parseInt(totalPages); i++) {
    const filename = PDFPath.split('/').pop();
    const outfilename = `page-${i}.txt`
    // temp directory in the current directory
    const OutFolder = `./tmp/${filename}/`;
    const OutFilePath = `${OutFolder}${outfilename}`;
    if (!existsSync("./tmp")) {
      await fs.mkdir("./tmp");
    }
    // check if directory exists
    if (!existsSync(OutFolder)) {
      await fs.mkdir(OutFolder);
    }
    // check if file exists
    if (!existsSync(OutFilePath)) {
      // create file
      const pageCommand = `${command} -f ${i} -l ${i} ${PDFPath} ${OutFilePath}`;

      try {
          await execAsync(pageCommand);
      } catch (error: any) {
          throw new Error(`Error executing pdftotext: ${error.message}`);
      }
    }
    try {
        const content = await fs.readFile(OutFilePath, 'utf8');
        if (content.length < 5) {
          // empty page
          continue;
        }
        // identify the page number
        //const pageNumber = await getPageNumberFromText(content);
        //console.log(`Page at index ${i} has page number ${pageNumber}`)
        pages.push({ id: uuidv4(), index: i, pageNumber: i.toString(), content, tags: [] });
    } 
    catch (error: any) {
        throw new Error(`Error reading output text file: ${error.message}`);
    }
  }

  return pages;
}