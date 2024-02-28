
import puppeteer, { Browser } from 'puppeteer';
import cheerio from 'cheerio';
import pLimit, { Limit } from 'p-limit';
import { URL } from 'url';
import { SitePage } from '../indices/WebsiteIndex';
import { v4 as uuidv4 } from 'uuid';

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
    const ignoreList = [
        '/tag/',
        "#",
        "jpg",
        "jpeg",
        "png",
        "gif",
        "pdf",
        "doc",
        "docx",
        "xls",
    ];
    if (ignoreList.some(ignore => url.includes(ignore))) {
        return { pairs: [], links: [] };
    }

    console.log(`Crawling ${url} at depth ${depth}`);
    try {
        const normalizedUrl = normalizeUrl(url);
        if (visited.has(normalizedUrl)) {
            return { pairs: [], links: [] };
        }
        visited.add(normalizedUrl);

        const page = await browser.newPage();
        // chrome user agent
        const userAgents = [
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Internet Explorer 11.0; Win7',
            'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)',
            "Edge/14.14393",
        ]
        page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 1000000 });
        const bodyHTML = await page.evaluate(() => document.body.innerHTML);
        const $ = cheerio.load(bodyHTML);

        // Remove scripts and style content
        $('script').remove();
        $('style').remove();
        // remove divs with id=ccc
        $('div[id="ccc"]').remove();

        // extract text from class=container
        let pageText = $('div[class="page__main"]').text();

        // Clean text: remove extra spaces within lines, newlines, and HTML comments
        pageText = pageText.replace(/\s\s+/g, ' ').trim(); // Replace multiple spaces with a single space within lines
        pageText = pageText.replace(/[\r\n]+/g, '\n'); // Replace multiple new lines and carriage returns with a single newline
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

        return { pairs, links: sameHostLinks };
    } catch (error) {
        console.error(`Failed to crawl the page at url ${url}: ${error}`);
        return { pairs: [], links: [] };
    }
}

export async function crawlWebsite(baseURL: string, concurrency: number, maxDepth: number, delay: number): Promise<SitePage[]> {
    const limit = pLimit(concurrency);
    const visited = new Set<string>();

    try {
        const browser = await puppeteer.launch({ headless: true });
        let results: SitePage[] = [];
        let nextLinks: string[] = [baseURL];

        for (let depth = 0; depth <= maxDepth; depth++) {
            const crawlTasks: Promise<CrawlPageResult>[] = nextLinks.map(url => limit(() => crawlPage(browser, url, depth, maxDepth, delay, visited)));
            const crawlResults = await Promise.all(crawlTasks);
            nextLinks = crawlResults.flatMap(result => result.links);
            // Update the results array to store SitePage objects
            results = results.concat(crawlResults.flatMap(result => result.pairs.map(pair => {
                return { id: uuidv4(), url: pair.url, content: pair.text, tags: [] };
            })));
        }

        await browser.close();
        return results;
    } catch (error) {
        console.error(`Failed to crawl the website: ${error}`);
        return [];
    }
}