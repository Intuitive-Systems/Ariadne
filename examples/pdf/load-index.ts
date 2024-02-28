import { DocumentIndex } from "../../src";
import fs from "fs";

async function main() {
    const savedIndex = JSON.parse(fs.readFileSync(__dirname + "/../indices/theseus-minotaur.index.json").toString());
    const index = DocumentIndex.fromJSON(savedIndex);

    const query = "Who is Ariadne?";
    const results = await index.query(query, 3);
    console.log(`Search Results: ${JSON.stringify(results.map(r => ({ page: r.pageNumber, chunk: r.chunkNumber, score: r.similarity, content: r.content })), null, 2)}`);
}

(async () => {
    main();
})();