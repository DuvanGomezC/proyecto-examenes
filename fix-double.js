const fs = require('fs');
const path = require('path');

const uiFile = path.join(__dirname, 'js', 'ui-render.js');
let code = fs.readFileSync(uiFile, 'utf8');

code = code.replace(/async async/g, 'async');

fs.writeFileSync(uiFile, code);
console.log("Fixed double async syntax errors.");
