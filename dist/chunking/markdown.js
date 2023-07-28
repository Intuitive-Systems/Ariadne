"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkMarkdown = void 0;
async function chunkMarkdown(markdown, maxChunkSize = 3000) {
    // take markdown and split it into header-delimited chunks of no more than maxChunkSize characters
    // delimit chunks by he
    const chunks = [];
    const lines = markdown.split("\n");
    let chunkNumber = 0;
    let chunk = "";
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (line.startsWith("##")) {
            // new chunk
            if (chunk.length > 0) {
                chunks.push({ chunkNumber, content: chunk });
                chunk = "";
                chunkNumber++;
            }
        }
        chunk += line + "\n";
        i++;
    }
    if (chunk.length > 0) {
        chunks.push({ chunkNumber, content: chunk });
    }
    return chunks;
}
exports.chunkMarkdown = chunkMarkdown;
