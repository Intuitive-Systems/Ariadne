"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkText = void 0;
async function chunkText(text, chunkSize = 2000) {
    const chunks = [];
    const words = text.split(' ');
    let chunkNumber = 0;
    let chunk = '';
    let i = 0;
    while (i < words.length) {
        if (chunk.length + words[i].length > chunkSize) {
            chunks.push({ chunkNumber, content: chunk });
            chunkNumber++;
            chunk = '';
        }
        else {
            chunk += words[i] + ' ';
            i++;
        }
    }
    if (chunk.length > 0) {
        chunks.push({ chunkNumber, content: chunk });
    }
    return chunks;
}
exports.chunkText = chunkText;
