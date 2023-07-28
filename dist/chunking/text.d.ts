export declare function chunkText(text: string, chunkSize?: number): Promise<{
    chunkNumber: number;
    content: string;
}[]>;
