const ax = require('axios');
const ch = require('cheerio');

const SEARCH = 'https://www.google.com/search';
const WHOIS = 'https://www.whois.com/whois/';


const delay = (func, {domain, delay}) => {
    return new Promise(resolve => {
        setTimeout(async() => {
            let res = await func(domain);
            resolve(res);
        }, delay);
      });
}

const cited = async(domain) => {
    let fb = 'NO';
    let yelp = 'NO';
    let href = '';

    // add cookies?
    await ax.get(SEARCH, {
            params: { q: `"${domain}"` }
        }, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
            }
        })
        .then((res) => {
            const $ = ch.load(res.data);
            const match = $('a');

            match.each((i, e) => {
                if($(e).find('h3 div').text()) {
                    href = $(e).attr('href');

                    if(href.includes('yelp')) yelp = 'YES';
                    if(href.includes('facebook')) fb = 'YES';
                }
            });

            return { yelp, fb };
        })
        .catch((err) => {
            // status: 429,
            // statusText: 'Too Many Requests',
            const { response: { status, statusText } } = err;
            console.log('ERROR:', statusText);
        });

    // return default if undefined
    return { yelp, fb };
}

const expired = async({ browser, domain, hasBalance, today }) => {

    const URL = WHOIS+domain
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if(['image', 'stylesheet', 'font'].indexOf(req.resourceType()) !== -1) {
            req.abort();
        } else {
            req.continue();
        }
    });
    
    let retry = false;
    let available = null;

    try {

        await page.goto(URL, { waitUntil: "domcontentloaded" });
        const content = await page.content();
        
        const $ = ch.load(content);
        await page.waitForSelector('.whois_main_column');

        let isBlocked = ($("#securityBlk").css('display') == 'block');
        let isNotRegistered = $("#availableBlk > div").length;

        // solve captcha here...
        if(isBlocked) {
            await page.waitForSelector('.g-recaptcha');
            const sitekey = $(".g-recaptcha").attr("data-sitekey");

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
            }

            retry = true;
        } // isBlocked

        if(retry) {
            await page.waitForTimeout(5000);
            isBlocked = await page.evaluate(() => ($("#securityBlk").css('display') == 'block'));
    
            console.log('block =>', isBlocked, '=', $("#securityBlk").css('display'));
        }

        if(!isBlocked) {
            if(isNotRegistered) {
                available = 'YES';
            } else {
                await page.waitForSelector('.df-block');

                const div = $(".df-block");
                const row = $(div[0]).children();
                const col = $(row[4]).children();

                let expires = new Date($(col[1]).text());

                available = (today > expires) ? 'YES' : 'NO';
            }
        }

    } catch (e) {
        // if(e) throw(e);
        console.log(e);
        // available = 'error';
    }

    await page.close();
    return { available, retry };
}

module.exports = async(domains) => {

    const len = (domains.length-1);
    const min = 3000; // 3secs
    const max = 5000; // 5secs

    let i = 1;
    let citations = [];
    let res = '';
    let rand = 0;
    let args = {
        domain: '',
        delay: 0,
    }

    for (i = 0; i < len; i++) {

        rand = Math.ceil(Math.random() * (max - min) + min);
        args.domain = domains[i];
        args.delay = rand;
        
        // check if expired
        res = await delay(expired, args);
        
        // check for fb/yelp
        // res = await delay(cited, args);

        // console.log(domains[i], '=>', res);
        // console.log((rand/1000).toFixed(2),'s =>', domains[i], '=>', res);

    }

    return citations;
};