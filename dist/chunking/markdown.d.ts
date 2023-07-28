export interface MarkdownChunk {
    chunkNumber: number;
    content: string;
}
export declare function chunkMarkdown(markdown: string, maxChunkSize?: number): Promise<MarkdownChunk[]>;
