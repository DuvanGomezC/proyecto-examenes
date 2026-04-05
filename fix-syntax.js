const fs = require('fs');
const path = require('path');

const uiFile = path.join(__dirname, 'js', 'ui-render.js');
let code = fs.readFileSync(uiFile, 'utf8');

code = code.replace(/function await /g, "async function ");

fs.writeFileSync(uiFile, code);
console.log("ui-render.js syntax errors fixed.");
