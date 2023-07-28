import { openaiEmbedding } from '../openai/openai';
import similarity from 'compute-cosine-similarity';
import { chunkText } from '../chunking/text';

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

export type ChunkResult = PageChunk & { similarity: number };

export interface Document {
  pages: Page[];
  chunks: PageChunk[];
}

export interface ChunkingFunction {
  (text: string, chunkSize: number): Promise<{ chunkNumber: number, content: string }[]>;
}

export interface TextConversionFunction {
  (text: string): Promise<string>;
}



export class DocumentIndex {
  private document: Document;
  private textConverter: TextConversionFunction = null;
  private chunkPage: ChunkingFunction;

  constructor(pages: Page[], chunkMethod: ChunkingFunction = chunkText, textConverter: TextConversionFunction = null) {
    // move createIndex out of constructor
    this.chunkPage = chunkMethod;
    this.textConverter = textConverter;
  }

  private async createIndex(pages: Page[], chunkSize: number = 2000): Promise<Document> {

    if (this.textConverter) {
      for (const page of pages) {
        page.textConversion = await this.textConverter(page.content);
      }
    }

    const chunks: PageChunk[] = [];

    console.log(`Chunking PDF into ${chunkSize} character chunks from ${pages.length} pages...`)
    for (const page of pages) {
      // report progress for every 10 pages
      if (page.page % 10 === 0) {
        console.log(`Chunking page ${page.page}...`);
      }
      let pageChunks;
      if (this.textConverter) {
        pageChunks = await this.chunkPage(page.textConversion, chunkSize);
      }
      else {
        pageChunks = await this.chunkPage(page.content, chunkSize);
      }

      for (const chunk of pageChunks) {
        const embedContent = chunk.content.replace(/(\r\n|\n|\r|\t)/gm, ' ').replace(/\s+/g, ' ').trim();
        const embedding = await openaiEmbedding(embedContent);
        chunks.push({ page: page.page, chunkNumber: chunk.chunkNumber, content: chunk.content, embedding: embedding.data[0].embedding, tags: []});
      }
    }

    return { pages, chunks };
  }

  static async fromPages(pages: Page[], chunkMethod: ChunkingFunction = chunkText, textConverter: TextConversionFunction = null): Promise<DocumentIndex> {
    const instance = new DocumentIndex(pages, chunkMethod, textConverter);
    instance.document = await instance.createIndex(pages);
    return instance;
  }

  public static fromJSON(document: Document): DocumentIndex {
    const instance = new DocumentIndex([]);
    instance.document = document;
    return instance;
  }

  public async query(query: string, k: number = 5): Promise<ChunkResult[]> {
    const results: ChunkResult[] = [];

    const queryEmbedding = await openaiEmbedding(query);

    for (const chunk of this.document.chunks) {
      const res = similarity(chunk.embedding, queryEmbedding.data[0].embedding);
      results.push({ ...chunk, similarity: res });
    }
    return results.filter((result) => result.content.length > 50).sort((a, b) => b.similarity - a.similarity).slice(0, k);
  }

  public save(): Document {
    return this.document;
  }


}