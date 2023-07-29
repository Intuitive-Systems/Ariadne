import { BaseIndex, Record, RecordChunk, RecordIndex, ConversionFunction, ChunkingFunction } from './BaseIndex';
import { openaiEmbedding } from '../openai/openai';
import similarity from 'compute-cosine-similarity';
import { chunkText } from '../chunking';

export interface Page extends Record {
  pageNumber: number;
}

export interface PageChunk extends RecordChunk {
  pageNumber: number;
}

export type PageChunkResult = PageChunk & { similarity: number };

export interface DocumentIndexI extends RecordIndex {
  records: Page[];
  chunks: PageChunk[];
}

export class DocumentIndex extends BaseIndex<Page> {

  constructor(records: Page[], chunkingFunction: ChunkingFunction, conversionFunction: ConversionFunction) {
    super(records, chunkingFunction, conversionFunction);
  }

  protected async createIndex(chunkSize: number = 1000): Promise<void> {
    const pages = this.records;
    const chunks: PageChunk[] = [];

    for (const page of pages) {
      let pageChunks;
      if (this.conversionFunction) {
        page.textConversion = await this.conversionFunction(page.content);
        pageChunks = await this.chunkingFunction(page.id, page.textConversion, chunkSize);
      } else {
        pageChunks = await this.chunkingFunction(page.id, page.content, chunkSize);
      }

      for (const chunk of pageChunks) {
        const embedContent = chunk.content.replace(/(\r\n|\n|\r|\t)/gm, ' ').replace(/\s+/g, ' ').trim();
        const embedding = await openaiEmbedding(embedContent);
        chunks.push({ ...chunk, pageNumber: page.pageNumber, embedding: embedding.data[0].embedding });
      }
    }
    const index: DocumentIndexI = {
      chunkSize,
      records: pages,
      chunks
    }
    this.index = index;
  }

  public static async fromRecords(records: Page[], chunkSize: number = 1000, chunkingFunction: ChunkingFunction = chunkText, conversionFunction: ConversionFunction = null): Promise<DocumentIndex> {
    const instance = new DocumentIndex(records, chunkingFunction, conversionFunction);
    await instance.createIndex(chunkSize);
    return instance;
  }

  public static fromJSON(recordIndex: DocumentIndexI, chunkingFunction: ChunkingFunction = chunkText, conversionFunction: ConversionFunction = null): DocumentIndex {
    const instance = new DocumentIndex(recordIndex.records, chunkingFunction, conversionFunction);
    instance.index = recordIndex;
    return instance;
  }

  public async query(query: string, k: number = 5): Promise<PageChunkResult[]> {
    const results: PageChunkResult[] = [];

    const queryEmbedding = await openaiEmbedding(query);

    for (const chunk of this.index.chunks as PageChunk[]) {
      const res = similarity(chunk.embedding, queryEmbedding.data[0].embedding);
      const payload: PageChunkResult = { ...chunk, similarity: res };
      results.push({ ...chunk, similarity: res });
    }
    return results.filter((result) => result.content.length > 50).sort((a, b) => b.similarity - a.similarity).slice(0, k);
  }
}