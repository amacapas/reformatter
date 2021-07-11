const xl = require('xlsx');
const ax = require('axios');
const ch = require('cheerio');

const SEARCH = 'https://www.google.com/search';

const delay = (func, {name, phone, delay}) => {
    return new Promise(resolve => {
        let res = '';
        setTimeout(async() => {
            res = await func(name, phone);
            resolve(res);
        }, delay);
      });
}

const hasFb = async(name, phone) => {
    let path = '';
    let retval = 'NO';

    const fb = await ax.get(SEARCH,  {
            params: { q: name + 'facebook' }
        })
        .then((res) => {
            const $ = ch.load(res.data);
            const match = $('a');
            let link = '';

            match.each((i, e) => {
                if($(e).find('h3 div').text()) {
                    link = $(e).attr('href').replace('/url?q=','');
                    path = link.split('&')[0];
                    if(path.includes('facebook')) return false;
                }
            });

            if(path) return ax.get(path);
            return retval;
        })
        .then((res) => {
            const $ = ch.load(res.data);
            let _phone = phone.replace('(','').replace(') ','-');
            let _found = $('#PagesProfileHomeSecondaryColumnPagelet div:contains("'+_phone+'")').text();

            if(_found) retval = 'YES';
            return retval;
        })
        .catch((err) => {
            // console.log('ERROR:', name, '=>', path);
            // if(err) throw err;
        });

    return (fb === undefined) ? 'NO' : fb;
}

const hasYelp = async(name, phone) => {
    let path = '';
    let retval = 'NO';

    const yelp = await ax.get(SEARCH,  {
            params: { q: name + 'yelp' }
        })
        .then((res) => {
            const $ = ch.load(res.data);
            const match = $('a');
            let link = '';

            match.each((i, e) => {
                if($(e).find('h3 div').text()) {
                    link = $(e).attr('href').replace('/url?q=','');
                    path = link.split('&')[0];
                    if(path.includes('yelp')) return false;
                }
            });

            if(path) return ax.get(path);
            return retval;
        })
        .then(res => {
            const $ = ch.load(res.data);
            if($('p:contains("'+phone+'")').text()) retval = 'YES';            
            return retval;
        })
        .catch((err) => {
            // console.log(err);
        });

    return (yelp === undefined) ? 'NO' : yelp;
}

module.exports = async(fn) => {
    const wb = xl.readFile(fn);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = xl.utils.sheet_to_json(ws, { header: 1 });
    
    const len = (rows.length-1);
    const min = 300000; // 5mins
    const max = 600000; // 10mins

    // for testing
    // const min = 60000; // 1min
    // const max = 180000; // 3mins

    let i = 1;
    let data = [];
    let website = '';
    let hasWebsite = '';
    let url = '';
    let row = [];
    let has_fb = 'NO';
    let has_yelp = 'NO';
    let rand = 0;
    let args = {
        name: '',
        phone: '',
        delay: 0,
    }

    console.log('mapping data...');

    for (i = 1; i <= len; i++) {
        row = rows[i];
        website = row[5];
        hasWebsite = (website !== undefined);
    
        // get only the domain
        if(hasWebsite) {
            url = new URL(website);
            website = url.hostname.replace('www.','');
        };

        // remove if locality & website is empty
        if(row[3] !== undefined && hasWebsite) {

            // timeout settings
            rand = Math.ceil(Math.random() * (max - min) + min);
            args.name = row[0];
            args.phone = row[4];
            args.delay = rand;

            // set timeout to avoid flag as bot
            has_fb = await delay(hasFb, args);
            has_yelp = await delay(hasYelp, args);

            // console.log(row[0], '=> FB:', has_fb, ', YELP:', has_yelp, '==', (rand/60000).toFixed(2), 'minutes');
            console.log((rand/60000).toFixed(2),'m =>', row[0]);

            data.push({
                'business': row[0],
                'street':row[2],
                'locality': row[3],
                'phone': row[4],
                'yelp': has_yelp,
                'fb': has_fb,
                'website': website,
                'email': row[6],
                'category': row[7],
            });
        };

    }
    
    // remove duplicates
    data = [...new Map(data.map(item => [item.business, item])).values()];

    // sort by locality
    data.sort((a,b) => a.locality > b.locality && 1 || -1);

    return data;
};

