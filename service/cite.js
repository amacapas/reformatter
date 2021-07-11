const ch = require('cheerio');
const pp = require('puppeteer');
const pe = require('puppeteer-extra');
const ps = require('puppeteer-extra-plugin-stealth');
// const ac = require("@antiadmin/anticaptchaofficial");
const ua = require('random-useragent');

const SEARCH = 'https://www.google.com/search';
const WHOIS = 'https://www.whois.com/whois/';
const API_KEY = '37deb275c680ea8c0dbc3848c7727747';

pe.use(ps());
// ac.setAPIKey(API_KEY);
// ac.getBalance()
//     .then(balance => console.log('balance:', balance, '\n'))
//     .catch(error => console.log('error with API key:', error));

const intercept = async(page) => {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if(['image', 'stylesheet', 'font', 'script'].indexOf(req.resourceType()) !== -1) {
            req.abort();
        } else {
            req.continue();
        }
    });
}

const citation = async({ browser, domain }) => {
    let fb = 'NO';
    let yelp = 'NO';

    const URL = `${SEARCH}?q=${domain}`;
    const waitForFunction = 'document.querySelector("body")';

    const page = await browser.newPage();
    await intercept(page);
    
    try {

        // CAPTCHA STILL SHOWING!!!
        // EXPLORE PROXY
        await page.setUserAgent(ua.getRandom());
        await page.goto(URL, { waitUntil: "domcontentloaded" });
        await page.waitForFunction(waitForFunction);

        const html = await page.content();

        const $ = ch.load(html);
        const hrefs = $('a');
        hrefs.each((i, e) => {
            if($(e).find('h3 div').text()) {
                href = $(e).attr('href');

                if(href.includes('yelp')) yelp = 'YES';
                if(href.includes('facebook')) fb = 'YES';
            }
        });

    } catch (e) {
    
    }

    // await page.waitForTimeout(3000);
    await page.close();
    return { yelp, fb };
}


const expired = async({ browser, domain, hasBalance, today }) => {

    let retry = false;
    let available = null;
    let res = {
        isBlocked: false,
        isNotRegistered: false
    };

    const URL = WHOIS+domain
    const page = await browser.newPage();
    await intercept(page);
    
    const status = async() => (await page.evaluate(() => {
        const isBlocked = ($("#securityBlk").css('display') == 'block');
        const isNotRegistered = ($("#availableBlk > div").length > 0);
    
        return { isBlocked, isNotRegistered };
    }));

    try {
        await page.goto(URL, { waitUntil: "domcontentloaded" });
        await page.waitForSelector('.whois_main_column');

        res = await status();

        // solve captcha here...
        if(res.isBlocked) {
            await page.waitForSelector('.g-recaptcha');
            const sitekey = await page.evaluate(() => $(".g-recaptcha").attr("data-sitekey"));

            if(hasBalance) {
                console.log(domain, '=> captcha...\n');

                await ac.solveRecaptchaV2Proxyless(URL, sitekey)
                    .then(async(res) => {
                        await page.evaluate((res) => {
                            $("#g-recaptcha-response").val(res);
                            $("input.ui-button").click();
                        }, res);
                        
                        // console.log('\n');
                        console.log(domain, '=> solved...', res, '\n');
                    })
                    .catch(e => console.log('captcha error:', e));
            } else {
                console.log('Insufficient funds.');
                return;
            }

            retry = true;
        } // isBlocked

        if(retry) {
            await page.waitForTimeout(5000);
            res = await status();
        }

        if(!res.isBlocked) {
            if(res.isNotRegistered) {
                available = 'YES';
            } else {
                await page.waitForSelector('.df-block');
                const expires = await page.evaluate(() => $(".whois_main_column").children(".df-block").eq(0).children(".df-row").eq(3).children(".df-value").text());

                available = (today > expires) ? 'YES' : 'NO';
            }
        }

    } catch (e) {
        // if(e) throw(e);
        console.log(e);
        // available = 'error';
    }

    await page.close();
    return { available };
}

module.exports = async(domains) => {

    const args = {
        browser: {},
        domain: ''
    }

    let i = 0;
    let items = [];

    // const browser = await pe.launch();
    const browser = await pe.launch({ headless: false });

    args.browser = await browser.createIncognitoBrowserContext();
    // args.browser = browser;

    while(items.length < domains.length) {
        try {

            args.domain = domains[i];
            const { fb, yelp } = await citation(args);

            // if(items.length >= 5) return;

            // args.today = new Date();
            // const { available } = await expired(args);
            items.push(domains[i]);
            // items.push({
            //     'domains': domains[i],
            //     'available': available,
            //     'fb': fb,
            //     'yelp': yelp,
            // });

            // console.log(domains[i], '=>', 'available', ', FB:', fb, ', YELP:', yelp);
            console.log(items.length, ':', domains[i], '=>', fb);
            i++;
            
        } catch (e) {
            console.log(e);
        }
    }

    await browser.close();

    // domains, available, fb, yelp
    return items;
};