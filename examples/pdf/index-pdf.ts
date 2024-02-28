import { DocumentIndex, extractPdf } from "../../src";
import fs from "fs";

const documentPath =  __dirname + "/../documents/theseus-minotaur.pdf";

async function main() {
    const pages = await extractPdf(documentPath);
    const index = await DocumentIndex.fromRecords(pages);

    const query = "Who is Ariadne?";
    const results = await index.query(query, 3);
    console.log(`Search Results: ${JSON.stringify(results.map(r => ({ page: r.pageNumber, chunk: r.chunkNumber, score: r.similarity, content: r.content })), null, 2)}`);

    const indexJson = index.toJSON();
    const path = __dirname + "/../indices/theseus-minotaur.index.json";
    fs.writeFileSync(path, JSON.stringify(indexJson, null, 2));
    console.log(`Successfully saved index to ${path}`);
}

(async () => {
    main();
})();