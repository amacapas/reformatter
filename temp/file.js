const xl = require('excel4node');
const wb = new xl.Workbook();

const headers = [
    'Business Name',
    'Street',
    'Locality',
    'Phone',
    'Website',
    'Email',
    'Category',
];

module.exports = (data, name, path) => {
    const ws = wb.addWorksheet(name);

    ws.column(1).setWidth(40);
    ws.column(2).setWidth(30);
    ws.column(3).setWidth(30);
    ws.column(4).setWidth(20);
    ws.column(5).setWidth(30);
    ws.column(6).setWidth(40);
    ws.column(7).setWidth(50);

    let i = 1;
    headers.forEach(heading => {
        ws.cell(1, i++)
            .string(heading)
            .style({
                font: { color: 'black', bold: true },
                fill: {
                    type: 'pattern',
                    patternType: 'solid',
                    bgColor: '#FFFF00',
                    fgColor: '#FFFF00',
                }
            });
    });

    let index = 2;
    let key = 1;

    data.forEach(obj => {
        key = 1;
        Object.keys(obj).forEach(name =>{
            ws.cell(index,key++)
                .string((obj[name] !== undefined) ? obj[name] : '');
        });

        index++;
    });

    wb.write(path);

    console.log('mapping data...DONE');
}