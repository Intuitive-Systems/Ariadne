export interface Record {
    id: string;
    content: string;
    textConversion?: string;
    tags: string[];
}

export interface RecordChunk {
    recordId: string;
    chunkNumber: number;
    content: string;
    tags: string[];
    embedding?: number[];
}

export type ChunkResult = RecordChunk & { similarity: number };

export interface RecordIndex {
    chunkSize: number;
    records: Record[];
    chunks: RecordChunk[];
}

export interface ConversionFunction {
    (input: string): Promise<string>;
}

export interface ChunkingFunction {
    (recordId: string, input: string, chunkSize: number): Promise<RecordChunk[]>;
}

export abstract class BaseIndex<R extends Record> {
    index: RecordIndex = null;
    records: R[] = [];
    conversionFunction: ConversionFunction;
    chunkingFunction: ChunkingFunction;

    protected constructor(records: R[], chunkingFunction: ChunkingFunction, conversionFunction: ConversionFunction = null) {
        this.records = records;
        this.chunkingFunction = chunkingFunction;
        this.conversionFunction = conversionFunction;
    }

    protected abstract createIndex(chunkSize: number): Promise<void>;

    // output index as JSON
    public toJSON(): RecordIndex {
        return this.index;
    }

    public abstract query(query: string, k: number): Promise<RecordChunk[]>;
}