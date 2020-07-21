const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const baseUrl = 'https://www.draftcab.io';
const filterNamedAnchors = href => href.indexOf('#') === -1;
const filterExternalUrls = href => !href.indexOf(baseUrl);
let linksAlreadyCrawled = []; // keep track of the links we've already crawled
let linksIdentified = []; // keep track of every link we come across, for comparison purposes
let linksLeftToCrawl = []; // keep a counter of what remains to be crawled
(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 250 });
  const extractLinks = async (url) => {
    const page = await browser.newPage(); // fire up a browser
    await page.goto(url); // navigate to the page
    console.log('Scraping: ', url);
    const linksOnPage = await page.$$eval('a', anchorElements => anchorElements.map(a => a.href)); // all links, including ones we don't want
    const filteredLinksOnPage = linksOnPage
      .filter(filterNamedAnchors)
      .filter(filterExternalUrls)
      .map(href => href.replace(/\/$/, '')) // remove trailing slashes
    // .map(href => { return { path: href, id: href.substr(href.lastIndexOf('/')) } }); // we can convert this into the format the a11y auditor needs later
    await page.close();

    linksAlreadyCrawled.push(url); // register this page as one we've crawled
    linksIdentified.push(...filteredLinksOnPage); // register all links on this page

    // go fetch the next page
    console.log('linksAlreadyCrawled', linksAlreadyCrawled);
    console.log('linksIdentified', linksIdentified);

    linksLeftToCrawl = linksIdentified.filter(link => !linksAlreadyCrawled.includes(link));
    console.log('linksLeftToCrawl', linksLeftToCrawl);
    // what is the next url?
    const nextPage = linksLeftToCrawl[0];
    console.log('nextPage', nextPage);
    // if there's a next page, re-call this function recursively with the nextPage url, otherwise return the final list
    return !!nextPage ? filteredLinksOnPage.concat(await extractLinks(nextPage)) : filteredLinksOnPage;
  }

  const allLinks = await extractLinks(baseUrl);
  const linkSet = new Set(allLinks);
  const uniqueLinks = Array.from(linkSet);

  console.log('------------------');
  console.log(uniqueLinks);

  await browser.close();

})();
