/* eslint no-console: 0 */
const fs = require('fs');
const path = require('path');

fs.writeFileSync(path.resolve(__dirname, 'sitemap.json'), JSON.stringify([
  {
    "id": "Deque home",
    "path": "https://www.deque.com/"
  },
  {
    "id": "WCAG Overview",
    "path": "https://www.w3.org/WAI/standards-guidelines/wcag/"
  }
], null, 2));

console.log(`Using sitemap at: ${path.resolve(__dirname, 'sitemap.json')}`);
