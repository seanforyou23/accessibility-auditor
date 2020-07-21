const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const baseUrl = 'https://www.draftcab.io';
const filterNamedAnchors = href => href.indexOf('#') === -1;
const filterExternalUrls = href => !href.indexOf(baseUrl);
let linksAlreadyCrawled = [];
let linksIdentified = [];
let linksLeftToCrawl = [];

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 250 });

  const extractLinks = async (url) => {
    const page = await browser.newPage();
    await page.goto(url);
    console.log('Scraping: ', url);
    linksAlreadyCrawled.push(url);
    const linksOnPage = await page.$$eval('a', anchorElements => anchorElements.map(a => a.href)); // all links, including ones we don't want
    const filteredLinksOnPage = linksOnPage
      .filter(filterNamedAnchors)
      .filter(filterExternalUrls)
      .map(href => href.replace(/\/$/, ''))
      // .map(href => { return { path: href, id: href.substr(href.lastIndexOf('/')) } });
    await page.close();

    linksIdentified.push(...filteredLinksOnPage);

    // should we end recursion
    if (filteredLinksOnPage.length < 1) {
      return filteredLinksOnPage; // []
    } else {
      // go fetch the next page
      // console.log('filteredLinksOnPage', filteredLinksOnPage);
      console.log('linksAlreadyCrawled', linksAlreadyCrawled);
      console.log('linksIdentified', linksIdentified);

      linksLeftToCrawl = linksIdentified.filter(link => !linksAlreadyCrawled.includes(link));
      console.log('linksLeftToCrawl', linksLeftToCrawl);
      // what is the next url?
      const nextPage = linksLeftToCrawl[0];
      console.log('nextPage', nextPage);
    }

    return filteredLinksOnPage;
  }

  const links = await extractLinks(baseUrl);

  await browser.close();

})();
