const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const puppeteer = require('puppeteer');
const program = new Command();
let baseUrl;
program
  .version(require('../package.json').version)
  .option('-l, --log', 'instructs the script to log info to the console')
  .option('-d, --debug', 'runs puppeteer in headful mode and slows down the script for debugging purposes')
  .requiredOption('-u, --url', 'sets the base domain to crawl from')
  .action((cmd, options) => {
    baseUrl = options[0];
  });
program.parse(process.argv);
const convertToAuditorFormat = (listOfLinks) => listOfLinks.map(href => {
  return {
    path: href,
    id: href === baseUrl ? 'Home' : href.substr(href.lastIndexOf('/'))
  }
});
const filterNamedAnchors = href => {
  if (typeof href === 'object') { return false; }
  return href.indexOf('#') === -1;
};
const filterExternalUrls = href => !href.indexOf(baseUrl);
let linksAlreadyCrawled = []; // keep track of the links we've already crawled
let linksIdentified = []; // keep track of every link we come across, for comparison purposes
let linksLeftToCrawl = []; // keep a counter of what remains to be crawled
(async () => {
  const browser = await puppeteer.launch(program.debug ? { headless: false, slowMo: 250 } : { headless: true });
  const extractLinks = async (url) => {

    const page = await browser.newPage(); // fire up a new browser tab
    await page.setViewport({ width: 768, height: 1024 });
    try {
      await page.goto(url, { waitUntil: 'networkidle2' }); // navigate to the page
    } catch(error) {
      console.log('there was an error fetching page, ', url, error);
    }

    program.log && console.log('Scraping: ', url, `-- uptime: ${Math.floor(process.uptime())} seconds`);
    const linksOnPage = await page.$$eval('a', anchorElements => anchorElements.map(a => a.href)); // all links, including ones we don't want
    const filteredLinksOnPage = linksOnPage
      .filter(filterNamedAnchors)
      .filter(filterExternalUrls)
      .map(href => href.replace(/\/$/, '')) // remove trailing slashes to normalize the paths
    await page.close();

    linksAlreadyCrawled.push(url); // register this page as one we've crawled
    linksIdentified.push(...filteredLinksOnPage); // register all links on this page
    linksLeftToCrawl = linksIdentified.filter(link => !linksAlreadyCrawled.includes(link));

    program.log && console.log(`${linksLeftToCrawl.length} pages left to crawl`);
    // what is the next url?
    const nextPage = linksLeftToCrawl[0];
    // if there's a next page, re-call this function recursively with the nextPage url, otherwise return the final list
    return !!nextPage ? filteredLinksOnPage.concat(await extractLinks(nextPage)) : filteredLinksOnPage;
  }

  const allLinks = await extractLinks(baseUrl);
  // remove duplicates in the array by converting to a set and then back to an array
  const linkSet = new Set(allLinks);
  const uniqueLinks = Array.from(linkSet);

  program.log && console.log(`------- ${uniqueLinks.length} Links identified --------`);
  const dumpPath = path.resolve(__dirname, 'sitemap.json');
  fs.writeFileSync(dumpPath, JSON.stringify(convertToAuditorFormat(uniqueLinks), null, 2));
  console.log('Sitemap available at: ', dumpPath);

  await browser.close();
})();
