const xlsx = require('xlsx');

function test() {
   const wp = xlsx.readFile('Bioalquimia_Lista_Precios_Actualizada MARZO2026(1).xlsx');
   const ws = xlsx.utils.sheet_to_json(wp.Sheets['Hoja1'], { header: 1 });
   console.log(JSON.stringify(ws.slice(0, 25), null, 2));
}
test();
