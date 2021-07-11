const xl = require('xlsx');

module.exports = (fn, fp) => {
    const wb = xl.readFile(fp);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = xl.utils.sheet_to_json(ws, { header: 1 });
    
    const len = (rows.length-1);

    let i = 1;
    let address = [];
    let domains = [];
    let website = '';
    let hasWebsite = '';
    let url = '';
    let row = [];
    let local = '';

    // start timer
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

            // remove different locality
            local = fn.replace(' ', ', ');
            if(row[3].includes(local)) {
                domains.push(website);
                address.push({
                    'business': row[0],
                    'street': row[2],
                    'locality': row[3],
                    'phone': row[4],
                    'website': website,
                    'email': row[6],
                    'category': row[7],
                });
            }
        };
    }
    
    // remove duplicates
    address = [...new Map(address.map(item => [item.business, item])).values()];
    domains = [...new Set(domains)];

    // end timer
    // console.log('filtering data...DONE', address.length);

    return { address, domains };
};

