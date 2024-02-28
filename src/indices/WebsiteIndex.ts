import { BaseIndex, Record, RecordChunk, RecordIndex, ConversionFunction, ChunkingFunction } from './BaseIndex';
import { openaiEmbedding } from '../openai/openai';
import similarity from 'compute-cosine-similarity';
import { chunkParagraphs, chunkText } from '../chunking';
import { classifyCategory, createSearchTerms, getKeyword, SelectCategoryLabel } from '../openai';
import MiniSearch from 'minisearch';
import { Document } from 'flexsearch-ts';
import lunr from 'lunr';

export interface SitePage extends Record {
    url: string;
}

export interface SitePageChunk extends RecordChunk {
    url: string;
}

export type SitePageChunkResult = SitePageChunk & { similarity: number };

export interface WebsiteIndexI extends RecordIndex {
    records: SitePage[];
    chunks: SitePageChunk[];
}

export const tags = [
    'index',
    'article'
]

export class WebsiteIndex extends BaseIndex<SitePage> {

    constructor(records: SitePage[], chunkingFunction: ChunkingFunction, conversionFunction: ConversionFunction) {
        super(records, chunkingFunction, conversionFunction);
    }

    protected async createIndex(chunkSize: number, tags: SelectCategoryLabel): Promise<void> {
        const pages = this.records;
        const chunks: SitePageChunk[] = [];

        for (const page of pages) {
            // if tags are provided, classify the page
            if (tags) {
                // truncate to 3000 characters
                const content = page.content.length > 3000 ? page.content.substring(0, 3000) : page.content;
                const prompt = `URL: ${page.url}\n\nContent: ${content}`
                const classification = await classifyCategory(prompt, tags);
                page.tags.push(classification.label);
            }


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
                chunks.push({ ...chunk, url: page.url, embedding: embedding.data[0].embedding, tags: page.tags });
            }
        }
        const index: WebsiteIndexI = {
            chunkSize,
            records: pages,
            chunks
        }
        this.index = index;
    }

    public static async fromRecords(records: SitePage[], tags: SelectCategoryLabel = null,  chunkSize: number = 1000, chunkingFunction: ChunkingFunction = chunkParagraphs, conversionFunction: ConversionFunction = null): Promise<WebsiteIndex> {
        const instance = new WebsiteIndex(records, chunkingFunction, conversionFunction);
        await instance.createIndex(chunkSize, tags);
        return instance;
    }

    public static fromJSON(recordIndex: WebsiteIndexI, chunkingFunction: ChunkingFunction = chunkText, conversionFunction: ConversionFunction = null): WebsiteIndex {
        const instance = new WebsiteIndex(recordIndex.records, chunkingFunction, conversionFunction);
        instance.index = recordIndex;
        return instance;
    }

    public async keywordSearch(keyword: string, numResults: number) {
        const resultsArr = [];
        for (const chunk of this.index.chunks) {
          // lowercase both the keyword and the chunk content
            keyword = keyword.toLowerCase();
            const content = chunk.content.toLowerCase();
          if (content.includes(keyword)) {
            resultsArr.push(chunk);
          }
        }
        return resultsArr.slice(0, numResults);
    }

    public async urlSearch(keyword: string, numResults: number) {
        const resultsArr = [];
        for (const chunk of this.index.chunks as SitePageChunk[]) {
          // lowercase both the keyword and the chunk content
            keyword = keyword.toLowerCase();
            const url = chunk.url.toLowerCase();
          if (url.includes(keyword)) {
            resultsArr.push(chunk);
          }
        }
        // deduplicate
        const deduped = resultsArr.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
        return deduped.slice(0, numResults);
    }

    public async fullTextSearch(query: string, k: number) {
        const queryEmbedding = await openaiEmbedding(query);
        const chunks = this.index.chunks as SitePageChunk[];
        const documents = chunks.flatMap(c => ({ id: `${c.url}-${c.chunkNumber}`, url: c.url, content: c.content, embedding: c.embedding }));
        console.log(`Documents: ${documents.length}\n${JSON.stringify(documents.slice(0, 5).map(c => c.content), null, 2)}`);
       
        const idx = lunr(function () {
            this.ref('id')
            this.field('content')
            documents.forEach(function (doc) {
                this.add(doc)
            }, this)
        });
    
        const searchTerms = await createSearchTerms(query);
        //const searchTerms = await getKeyword(query);
        console.log(`Search Terms: ${searchTerms}`);
    
        // Search for documents
        let ret = idx.search(searchTerms);
        console.log(`Search Chunks: ${ret.length}`);
        // map back to actual documents
        const searchChunks = ret.map(({ ref }) => documents.find(doc => doc.id === ref)).slice(0, k);
        let results: SitePageChunkResult[] = [];
        for (const chunk of searchChunks) {
            const res = similarity(chunk.embedding, queryEmbedding.data[0].embedding);
            const payload: SitePageChunkResult = { ...chunk as any, similarity: res };
            results.push(payload);
        }
        return results.filter((result) => result.content.length > 50).sort((a, b) => b.similarity - a.similarity).slice(0, k);
    }
    public async query(query: string, k: number = 5, tags: string[] = []): Promise<SitePageChunkResult[]> {
        const results: SitePageChunkResult[] = [];

        const queryEmbedding = await openaiEmbedding(query);

        let searchChunks = this.index.chunks as SitePageChunk[];
        if (tags.length > 0) {
            // filter chunks by tags
            searchChunks = searchChunks.filter((chunk) => {
                // must match at least one tag
                for (const tag of tags) {
                    if (chunk.tags.includes(tag)) {
                        return true;
                    }
                }
                return false;
            });
        }

        for (const chunk of searchChunks) {
            const res = similarity(chunk.embedding, queryEmbedding.data[0].embedding);
            const payload: SitePageChunkResult = { ...chunk, similarity: res };
            results.push({ ...chunk, similarity: res });
        }
        return results.filter((result) => result.content.length > 50).sort((a, b) => b.similarity - a.similarity).slice(0, k);
    }
}