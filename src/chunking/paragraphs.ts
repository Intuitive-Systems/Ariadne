import { RecordChunk } from "../indices";

// recursively splits text using the first delimiter, then the second if the resulting chunks are still too large
function chunkHelper(
    text: string,
    delimiters: string[],
    maxChunkSize: number
): string[] {
    if (!text || !text.length) {
        return [];
    }
    if (text.length <= maxChunkSize) {
        return [text];
    }
    const delimiter = delimiters[0];
    const chunks = text.split(delimiter);
    const outChunks = chunks
        .map((chunk, i) => {
            let newText = chunk;
            if (i < chunks.length - 1) {
                newText += delimiter;
            }
            return chunkHelper(newText, delimiters.slice(1), maxChunkSize);
        })
        .reduce((a, b) => a.concat(b), []);

    return outChunks;
}

// function that takes a list of chunks and a max chunk size and combines them into chunks of no more than maxChunkSize
function combineChunks(chunks: string[], maxChunkSize: number): string[] {
    const outChunks: string[] = [];
    let chunk = "";
    for (const c of chunks) {
        if (chunk.length + c.length > maxChunkSize) {
            outChunks.push(chunk);
            chunk = "";
        }
        chunk += c;
    }
    if (chunk.length > 0) {
        outChunks.push(chunk);
    }
    return outChunks;
}


export async function chunkParagraphs(
    recordId: string,
    text: string,
    chunkSize: number = 2000
): Promise<RecordChunk[]> {
    // Recursively split, then combine chunks to preserve as much context as possible
    const smallChunks = chunkHelper(
        text,
        ["\n\n", ". ", "\n", " ", ""],
        chunkSize
    );
    const maximalChunks = combineChunks(smallChunks, chunkSize);
    return maximalChunks.map((chunk, i) => ({ recordId: recordId, chunkNumber: i, content: chunk, tags: [] }));
}