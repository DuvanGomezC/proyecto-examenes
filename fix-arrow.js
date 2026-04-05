const fs = require('fs');
const path = require('path');

const uiFile = path.join(__dirname, 'js', 'ui-render.js');
let code = fs.readFileSync(uiFile, 'utf8');

// Fix the lambda functions without block bodies: () => await ...
// E.g. `() => await openUserModal()` -> `async () => await openUserModal()`
code = code.replace(/\(\) => await /g, "async () => await ");

// Fix cases with arguments: `btn => await ...` or `e => await ...` 
// Not strictly needed if they have curly braces, but these lambdas don't:
// Like: `() => await renderExamsTab()` -> already caught by `() => await `

// Let's also check for `() => { window._activeTab = btn.dataset.tab; ... await renderTabContent`
// But my previous fix `fix-callbacks.js` did `addEventListener('click', () => {` -> `addEventListener('click', async () => {` which should cover it.
// Let's specifically fix any remaining `async async`:
code = code.replace(/async async/g, 'async');

fs.writeFileSync(uiFile, code);
console.log("Fixed missing async in arrow functions.");
