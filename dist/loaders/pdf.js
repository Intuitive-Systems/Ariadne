"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPdf = void 0;
const fs_1 = require("fs");
const util_1 = require("util");
const child_process_1 = require("child_process");
async function extractPdf(PDFPath) {
    if (!(0, fs_1.existsSync)(PDFPath)) {
        throw new Error(`PDF file does not exist: ${PDFPath}`);
    }
    const execAsync = (0, util_1.promisify)(child_process_1.exec);
    const command = `pdftotext -layout`;
    // Get the total number of pages
    const totalPagesCommand = `pdfinfo ${PDFPath} | awk '/Pages:/ {print $2}'`;
    const { stdout: totalPages } = await execAsync(totalPagesCommand);
    const pages = [];
    for (let i = 1; i <= parseInt(totalPages); i++) {
        const filename = PDFPath.split('/').pop();
        const outfilename = `page-${i}.txt`;
        // temp directory in the current directory
        const OutFolder = `./tmp/${filename}/`;
        const OutFilePath = `${OutFolder}${outfilename}`;
        if (!(0, fs_1.existsSync)("./tmp")) {
            await fs_1.promises.mkdir("./tmp");
        }
        // check if directory exists
        if (!(0, fs_1.existsSync)(OutFolder)) {
            await fs_1.promises.mkdir(OutFolder);
        }
        // check if file exists
        if (!(0, fs_1.existsSync)(OutFilePath)) {
            // create file
            const pageCommand = `${command} -f ${i} -l ${i} ${PDFPath} ${OutFilePath}`;
            try {
                await execAsync(pageCommand);
            }
            catch (error) {
                throw new Error(`Error executing pdftotext: ${error.message}`);
            }
        }
        try {
            const content = await fs_1.promises.readFile(OutFilePath, 'utf8');
            pages.push({ page: i, content, tags: [] });
        }
        catch (error) {
            throw new Error(`Error reading output text file: ${error.message}`);
        }
    }
    return pages;
}
exports.extractPdf = extractPdf;
