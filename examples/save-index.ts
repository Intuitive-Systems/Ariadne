import { DocumentIndex, extractPdf } from "../src";
import fs from "fs";
const documentPath =  __dirname + "/documents/theseus-minotaur.pdf";

async function main() {
    const pages = await extractPdf(documentPath);
    const index = await DocumentIndex.fromRecords(pages);

    const indexJson = index.toJSON();
    fs.writeFileSync(__dirname + "/indices/theseus-minotaur.index.json", JSON.stringify(indexJson, null, 2));
    console.log(`Successfully saved index to ${__dirname + "/indices/theseus-minotaur.index.json"}`);
}

(async () => {
    main();
})();