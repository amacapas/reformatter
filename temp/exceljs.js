const Excel = require('exceljs');
const fs = require('fs');

const filepath = './xlxs/';
const filename = filepath + 'twenty.xlsx';
const workbook = new Excel.Workbook();

// if (fs.existsSync(tmpfile)) {
//     console.log(__dirname+'/'+tmpfile);
// }
// return;

// fs.readdir(filepath, (err, files) => {
//     files.forEach(file => {
//         console.log(file);
//     });
// });

// const reformat = () => {}

let locality = '';
let website = '';
let business = '';
let domain = '';
let url = '';

let rows = [];
workbook.xlsx.readFile(filename)
    .then(() => {
        const worksheet = workbook.getWorksheet(1);
        
        // remove rating column
        worksheet.spliceColumns(2,1);
        
        worksheet.eachRow((row, num) => {
            // skip header
            if(num == 1) return;

            // rows.push('a');
            // console.log(JSON.stringify(row.values));

            // get columns
            locality = row.getCell(3).value;
            website = row.getCell(5).value;
            business = row.getCell(1).value;

            // trim to domain URL only
            if(website) {
                url = new URL(website);
                domain = url.hostname.replace('www.','');
                row.getCell(5).value = domain;
                row.commit();
            }

            // Remove empty cells under Locality column
            // Remove empty cells under Website column
            if(website == null || locality == null) {

                console.log('*',num, ':', business, '= ', (website==null ? null : 'ok'), ', ', (locality==null ? null : 'ok'));
                worksheet.spliceRows(num, 1);
                row.commit();
            } else {
                console.log(num, ':', business, '= ', (website==null ? null : 'ok'), ', ', (locality==null ? null : 'ok'));
            }

            // console.log(num, ':', business, '= ', (website==null ? null : 'ok'), ', ', (locality==null ? null : 'ok'));
            // console.log("\n--------------------------\n");
        });

        // console.log('done');
        return workbook.xlsx.writeFile(filepath + 'new1.xlsx');
    });

// Filter Locality based on the location you are working on
// Remove duplicates

// console.log('rows:', rows);

// ISSUES
// deleting rows shifted the value which causes unstable value during loop
// solution use json but can't get data from callback 
