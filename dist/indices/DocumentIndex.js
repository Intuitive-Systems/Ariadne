"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentIndex = void 0;
const openai_1 = require("../openai/openai");
const compute_cosine_similarity_1 = __importDefault(require("compute-cosine-similarity"));
const text_1 = require("../chunking/text");
class DocumentIndex {
    constructor(pages, chunkMethod = text_1.chunkText, textConverter = null) {
        this.textConverter = null;
        // move createIndex out of constructor
        this.chunkPage = chunkMethod;
        this.textConverter = textConverter;
    }
    async createIndex(pages, chunkSize = 2000) {
        if (this.textConverter) {
            for (const page of pages) {
                page.textConversion = await this.textConverter(page.content);
            }
        }
        const chunks = [];
        console.log(`Chunking PDF into ${chunkSize} character chunks from ${pages.length} pages...`);
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
                const embedding = await (0, openai_1.openaiEmbedding)(embedContent);
                chunks.push({ page: page.page, chunkNumber: chunk.chunkNumber, content: chunk.content, embedding: embedding.data[0].embedding, tags: [] });
            }
        }
        return { pages, chunks };
    }
    static async fromPages(pages, chunkMethod = text_1.chunkText, textConverter = null) {
        const instance = new DocumentIndex(pages, chunkMethod, textConverter);
        instance.document = await instance.createIndex(pages);
        return instance;
    }
    static fromJSON(document) {
        const instance = new DocumentIndex([]);
        instance.document = document;
        return instance;
    }
    async query(query, k = 5) {
        const results = [];
        const queryEmbedding = await (0, openai_1.openaiEmbedding)(query);
        for (const chunk of this.document.chunks) {
            const res = (0, compute_cosine_similarity_1.default)(chunk.embedding, queryEmbedding.data[0].embedding);
            results.push({ ...chunk, similarity: res });
        }
        return results.filter((result) => result.content.length > 50).sort((a, b) => b.similarity - a.similarity).slice(0, k);
    }
    save() {
        return this.document;
    }
}
exports.DocumentIndex = DocumentIndex;
