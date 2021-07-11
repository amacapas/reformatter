
//const puppeteer = require('puppeteer');
const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('random-useragent');

class PuppeteerService {

    constructor() {
        this.browser = null;
        this.page = null;
        this.pageOptions = null;
        this.waitForFunction = null;
        this.isLinkCrawlTest = null;
    }

    async initiate(countsLimitsData, isLinkCrawlTest) {
        this.pageOptions = {
            waitUntil: 'networkidle2',
            timeout: countsLimitsData.millisecondsTimeoutSourceRequestCount
        };
        this.waitForFunction = 'document.querySelector("body")';
        puppeteerExtra.use(pluginStealth());

        //const browser = await puppeteerExtra.launch({ headless: false });
        this.browser = await puppeteerExtra.launch({ headless: false });

        this.page = await this.browser.newPage();
        await this.page.setRequestInterception(true);

        this.page.on('request', (request) => {
            if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
                request.abort();
            } else {
                request.continue();
            }
        });
        this.isLinkCrawlTest = isLinkCrawlTest;
    }

    async crawl(link) {
        const userAgent = randomUseragent.getRandom();
        const crawlResults = { isValidPage: true, pageSource: null };
        try {
            await this.page.setUserAgent(userAgent);
            await this.page.goto(link, this.pageOptions);
            await this.page.waitForFunction(this.waitForFunction);
            crawlResults.pageSource = await this.page.content();
        }
        catch (error) {
            crawlResults.isValidPage = false;
        }
        if (this.isLinkCrawlTest) {
            this.close();
        }
        return crawlResults;
    }

    close() {
        if (!this.browser) {
            this.browser.close();
        }
    }
}

const puppeteerService = new PuppeteerService();
module.exports = puppeteerService;