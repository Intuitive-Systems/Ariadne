export interface Page {
    page: number;
    content: string;
    tags: string[];
    textConversion?: string;
}
export interface PageChunk {
    page: number;
    chunkNumber: number;
    content: string;
    tags: string[];
    embedding?: number[];
}
export type ChunkResult = PageChunk & {
    similarity: number;
};
export interface Document {
    pages: Page[];
    chunks: PageChunk[];
}
export interface ChunkingFunction {
    (text: string, chunkSize: number): Promise<{
        chunkNumber: number;
        content: string;
    }[]>;
}
export interface TextConversionFunction {
    (text: string): Promise<string>;
}
export declare class DocumentIndex {
    private document;
    private textConverter;
    private chunkPage;
    constructor(pages: Page[], chunkMethod?: ChunkingFunction, textConverter?: TextConversionFunction);
    private createIndex;
    static fromPages(pages: Page[], chunkMethod?: ChunkingFunction, textConverter?: TextConversionFunction): Promise<DocumentIndex>;
    static fromJSON(document: Document): DocumentIndex;
    query(query: string, k?: number): Promise<ChunkResult[]>;
    save(): Document;
}
