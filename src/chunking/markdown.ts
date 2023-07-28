
export interface MarkdownChunk {
    chunkNumber: number;
    content: string;
}

export async function chunkMarkdown(markdown: string, maxChunkSize: number = 3000): Promise<MarkdownChunk[]> {
    // take markdown and split it into header-delimited chunks of no more than maxChunkSize characters
    // delimit chunks by he
    const chunks: MarkdownChunk[] = [];
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