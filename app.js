const filepath = './xlxs/';
const filename = 'Waterford MI';
const fullpath = filepath + filename + '.xlsx';

const getData = require('./service/data');
const getCite = require('./service/cite');
const makeXLS = require('./service/file');

(async() => {
    console.log('filtering data...');

    const { address, domains } = getData(filename, fullpath);

    const citations = await getCite(domains);

    // const sheet = {
    //     addresses: address,
    //     citations
    // }
    
    if(address.length) {
        // TODOS - set dynamic filename
        // makeXLS(sheet, filename, fullpath);
    } else {
        console.log('file is empty');
    }

    // NOTES
    // remove if locality is not the filename/address
    // create 2 sheets; address,
        // available domains
        // - columns; domains, available, fb, yelp
        // search "domain" - look for fb and yelp url no more loading the page to check details

})();