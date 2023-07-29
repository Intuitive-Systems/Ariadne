
import puppeteer, { Browser } from 'puppeteer';
import cheerio from 'cheerio';
import pLimit, {Limit} from 'p-limit';
import { URL } from 'url';

interface UrlTextPair {
    url: string;
    text: string;
}

interface CrawlPageResult {
    pairs: UrlTextPair[];
    links: string[];
  }

function normalizeUrl(url: string): string {
    const urlObject = new URL(url);
    let normalizedUrl = urlObject.protocol + "//" + urlObject.hostname;
    if (urlObject.pathname) {
        normalizedUrl += urlObject.pathname.endsWith('/')
            ? urlObject.pathname.slice(0, -1)
            : urlObject.pathname;
    }
    return normalizedUrl;
}

export async function crawlPage(browser: Browser, url: string, depth: number, maxDepth: number, delay: number, visited: Set<string>): Promise<CrawlPageResult> {
    console.log(`Crawling ${url} at depth ${depth}`);
    try {
        const normalizedUrl = normalizeUrl(url);
        if (visited.has(normalizedUrl)) {
            return {pairs: [], links: []};
        }
        visited.add(normalizedUrl);

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 5000 });
        const bodyHTML = await page.evaluate(() => document.body.innerHTML);
        const $ = cheerio.load(bodyHTML);

        // Remove scripts and style content
        $('script').remove();
        $('style').remove();

        let pageText = $('body').text();

        // Clean text: remove extra spaces, newlines and HTML comments
        pageText = pageText.replace(/\s\s+/g, ' ').trim(); // Replace multiple spaces with a single space
        pageText = pageText.replace(/\r?\n|\r/g, ' '); // Replace new lines and carriage returns with a space
        pageText = pageText.replace(/<!--[\s\S]*?-->/g, ''); // Remove HTML comments

        let pairs: UrlTextPair[] = [{
            url: url,
            text: pageText
        }];

        let sameHostLinks: string[] = [];
        if (depth < maxDepth) {
            const links: string[] = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(link => link.href));
            const baseHostname = new URL(url).hostname;
            sameHostLinks = links.filter(link => {
                try {
                    return new URL(link).hostname === baseHostname;
                } catch (err) {
                    return false;  // ignore invalid URLs
                }
            });
        }
        await page.close();

        return {pairs, links: sameHostLinks};
    } catch (error) {
        console.error(`Failed to crawl the page at url ${url}: ${error}`);
        return {pairs: [], links: []};
    }
}

export async function crawlWebsite(baseURL: string, concurrency: number, maxDepth: number, delay: number): Promise<UrlTextPair[]> {
    const limit = pLimit(concurrency);
    const visited = new Set<string>();

    try {
        const browser = await puppeteer.launch({ headless: true });
        let results: UrlTextPair[] = [];
        let nextLinks: string[] = [baseURL];

        for (let depth = 0; depth <= maxDepth; depth++) {
            const crawlTasks: Promise<CrawlPageResult>[] = nextLinks.map(url => limit(() => crawlPage(browser, url, depth, maxDepth, delay, visited)));
            const crawlResults = await Promise.all(crawlTasks);
            nextLinks = crawlResults.flatMap(result => result.links);
            results = results.concat(crawlResults.flatMap(result => result.pairs));
        }

        await browser.close();
        return results;
    } catch (error) {
        console.error(`Failed to crawl the website: ${error}`);
        return [];
    }
}