const ac = require("@antiadmin/anticaptchaofficial");


const API_KEY = '';

ac.setAPIKey(API_KEY);

const URL = 'https://www.whois.com/whois/aaafloorsanding.com';
const KEY = '6Ldp5QMTAAAAADpcINfZtcfiCW_ivhongjwjSx9J';


(async() => {
    await ac.solveRecaptchaV2Proxyless(URL, KEY)
        .then(async(res) => {
            // expires = res;
            console.log('g-response: '+res);
            // console.log('google cookies:');
            // console.log(ac.getCookies());
        })
        .catch(e => console.log('captcha error:', e));
})();
