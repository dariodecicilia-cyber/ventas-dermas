const pdfParse = require('pdf-parse');
console.log("Type:", typeof pdfParse);
if (typeof pdfParse === 'object') {
    console.log("Keys:", Object.keys(pdfParse));
}
