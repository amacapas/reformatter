const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filepath = './xlxs/';
const filename = filepath + 'twenty.xlsx';

const workbook = XLSX.readFile(filename);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

const sheet = [];
let website = '';
let data = {};

// skip header
rows.slice(1).map((row) => {
    website = row[5];

    // get only the domain
    if(website) {
        url = new URL(website);
        website = url.hostname.replace('www.','');
    }

    // Remove empty cells under Locality column
    // Remove empty cells under Website column
    if(row[3] !== undefined && website !== undefined) {
        data = {
            'Business Name': row[0],
            'Street': row[2],
            'Locality': row[3],
            'Phone': row[4],
            'Website': website,
            'Email': row[6],
            'Category': row[7],
        }

        sheet.push(data);
    };
});

// const finalSheet = sheet.reduce((unique, o) => {
//     if(!unique.some(obj => obj['Businees Name'] === o['Businees Name'])) {
//       unique.push(o);
//     }
//     return unique;
// },[]);

// sheet.sort((a,b) => {
//     if (a.Locality > b.Locality)
//         return -1;
//     if (a.Locality < b.Locality)
//         return 1;
//     return 0;
// });

// sheet.sort((a,b) => a.Locality > b.Locality && 1 || -1);

sheet.sort((a,b) => a.Locality.localeCompare(b.Locality));


console.log(sheet);

// create new excel file
const wb = XLSX.WorkBook = XLSX.utils.book_new();
const ws = XLSX.utils._sheet(sheet);

const name = path.parse(filename).name + '-Edited.xlsx';

XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
XLSX.writeFile(wb, filepath + name);

// ISSUES
// styling is the issue