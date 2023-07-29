import { existsSync, promises as fs } from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';
import { Page } from '../indices/DocumentIndex';
import { v4 as uuidv4 } from 'uuid';

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
        pages.push({ id: uuidv4(), pageNumber: i, content, tags: [] });
    } 
    catch (error: any) {
        throw new Error(`Error reading output text file: ${error.message}`);
    }
  }

  return pages;
}