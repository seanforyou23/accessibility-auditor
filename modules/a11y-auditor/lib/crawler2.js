const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const baseUrl = 'https://www.patternfly.org/v4';
const filterNamedAnchors = href => href.indexOf('#') === -1;
const filterExternalUrls = href => !href.indexOf(baseUrl);

(async () => {

  const browser = await puppeteer.launch({ headless: false, slowMo: 250 });

  const page = await browser.newPage();
  await page.goto(baseUrl);

  const getAllPageLinks = await page.$$eval('a', anchorElements => anchorElements.map(a => a.href));

  const filteredLinks = getAllPageLinks
    .filter(filterNamedAnchors)
    .filter(filterExternalUrls)
    .map(href => { return { path: href, id: href.substr(href.lastIndexOf('/')) } })

  console.log(filteredLinks);

  await browser.close();

})();
