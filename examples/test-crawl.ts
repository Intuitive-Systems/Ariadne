import { crawlWebsite } from '../src/loaders/website';

const baseURL = "https://connerswann.me";

(async () => {
    console.log(`Crawling ${baseURL}`);
    const pairs = await crawlWebsite(baseURL, 2, 2, 1000);
    console.log(`Crawled ${pairs.length} pages`);
    // print 3 pages
    for (let i = 0; i < 3; i++) {
        console.log(`Page ${i}: ${pairs[i].url}`);
        console.log(`Page ${i} text: ${pairs[i].text}`);
    }
})();