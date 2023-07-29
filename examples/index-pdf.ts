import { DocumentIndex, extractPdf } from "../src";

const documentPath =  __dirname + "/documents/theseus-minotaur.pdf";

async function main() {
    const pages = await extractPdf(documentPath);
    const index = await DocumentIndex.fromRecords(pages);

    const query = "Who is Ariadne?";
    const results = await index.query(query, 3);
    console.log(`Search Results: ${JSON.stringify(results.map(r => ({ page: r.pageNumber, chunk: r.chunkNumber, score: r.similarity, content: r.content })), null, 2)}`);
}

(async () => {
    main();
})();