const xl = require('exceljs');
const wb = new xl.Workbook();

const addressHeaders = [
    { header:'Business Name', key:'business', width: 40, },
    { header:'Street', key:'street', width: 30 },
    { header:'Locality', key:'locality', width: 30 },
    { header:'Phone', key:'phone', width: 20 },
    { header:'Website', key:'website', width: 40 },
    { header:'Email', key:'email', width: 40 },
    { header:'Category', key:'category', width: 50 }
];

const domainHeaders = [
    { header: 'DOMAINS', key: 'domains', width: 40 },
    { header: 'AVAILABLE', key: 'available', width: 20 },
    { header: 'FB', key: 'fb', width: 20 },
    { header: 'YELP', key: 'yelp', width: 20 },
];

module.exports = (data, name, path) => {

    const { addresses, citations } = data;

    wb.xlsx.readFile(path)
        .then(() => {

            // console.log('mapping to worksheet...');

            // add address worksheet
            let ws = wb.addWorksheet(name);
            ws.columns = addressHeaders;

            // header styles
            ws.getRow(1).font = { bold: true };
            ws.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                bgColor: { argb: 'FFFF00' },
                fgColor: { argb: 'FFFF00' }
            };

            // add data
            ws.addRows(addresses);

            // console.log('adding address to worksheet...DONE');

            // add domain worksheet
            ws = wb.addWorksheet('DOMAINS');
            ws.columns = domainHeaders;

            // ws.addRows(citations);

            wb.xlsx.writeFile(path);

            // console.log('mapping to worksheet...DONE');
        });
}
