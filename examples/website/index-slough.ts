import { WebsiteIndex, crawlWebsite, SelectCategoryLabel, LabelType } from '../../src';
import fs from "fs";

const baseURL = "https://www.slough.gov.uk/council";

const websiteTags: SelectCategoryLabel = {
        name: "WebpageType",
        type: LabelType.SELECT_CATEGORY,
        description: "What type of webpage is this?",
        children: [
            {
                name: "INDEX",
                type: LabelType.CATEGORY,
                description: "This page is a list of links to other pages on the website",
                children: []
            },
            {
                name: "ARTICLE",
                type: LabelType.CATEGORY,
                description: "This page is an article",
                children: []
            },
            {
                name: "ARTICLE_LIST",
                type: LabelType.CATEGORY,
                description: "This page is a list of articles",
                children: []
            }
        ]
    };

(async () => {
    console.log(`Crawling ${baseURL}`);
    const pages = await crawlWebsite(baseURL, 2, 2, 1000);
    console.log(`Crawled ${pages.length} pages`);

    const index = await WebsiteIndex.fromRecords(pages);

    const indexJson = index.toJSON();
    const path = __dirname + "/../indices/slough.gov.uk.index.json";
    fs.writeFileSync(path, JSON.stringify(indexJson, null, 2));
    console.log(`Successfully saved index to ${path}`);
})();
