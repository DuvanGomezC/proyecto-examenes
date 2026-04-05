const fs = require('fs');
const path = require('path');

const uiFile = path.join(__dirname, 'js', 'ui-render.js');
let code = fs.readFileSync(uiFile, 'utf8');

// Event listeners that use await inside them but are not async
// E.g., `.addEventListener('click', () => {` -> `.addEventListener('click', async () => {`
// or `=> { ... await DB... }`

code = code.replace(/\(\) => \{([^}]+await DB[^}]+)\}/g, "async () => {$1}");
code = code.replace(/\(\) => ([^{]*await DB[^;]+;)/g, "async () => $1");
// The previous replace might not catch things over multiple lines if [^}] doesn't match well due to nested curlies.
// Let's do explicit replaces for known event listener lines based on the lint errors.

code = code.replace(/addEventListener\('click', \(\) => {/g, "addEventListener('click', async () => {");
code = code.replace(/addEventListener\('click', e => {/g, "addEventListener('click', async e => {");
code = code.replace(/addEventListener\('submit', e => {/g, "addEventListener('submit', async e => {");
code = code.replace(/document\.getElementById\('refresh-results-btn'\)\?\.addEventListener\('click', \(\) => renderResultsTab\(\)\);/g, "document.getElementById('refresh-results-btn')?.addEventListener('click', async () => await renderResultsTab());");

fs.writeFileSync(uiFile, code);
console.log("ui-render.js callbacks fixed.");
