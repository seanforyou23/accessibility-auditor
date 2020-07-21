const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
let topLevelPages = [];
const baseUrl = 'https://www.draftcab.io';

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 250 });
  let page = await browser.newPage();
  async function getPage(url) {
    try {
      await page.goto(url);
    } catch(error) {
      console.log(`Error fetching page: ${url} \n\n`, error);
      await browser.close();
    }

    return page;
  }

  await getPage(baseUrl);

  async function getPageLinks(page) {
    return page.$$eval('a', anchorElements => anchorElements.map(a => a.href));
  }

  const hrefs = await getPageLinks(page);

  console.log('allLinks: ', hrefs);

  const curPageSitemap = hrefs
    .filter(href => href.indexOf('#') === -1) // skip over in-page links (named anchors)
    .map((page) => {
      const pathName = page.substr(page.lastIndexOf('/'));
      return { path: page.replace(/\/$/, ''), id: pathName === '/' ? 'Home' : pathName }
    });

  topLevelPages = topLevelPages.concat(curPageSitemap);

  console.log('topLevelPages: ', topLevelPages);

  const localPages = topLevelPages
    .filter(page => !page.path.indexOf(baseUrl)) // don't test links that are to external sites
    .filter(page => page.path !== baseUrl) // only crawl home page once // todo: compare against growing list of pages

  console.log('localPages: ', localPages);

  localPages
    .reduce(async (prevPromise, nextPage) => prevPromise.then(() => {
      // console.log('nextPage', nextPage);
      return getPage(nextPage.path);
    }), Promise.resolve())
    .then(async (page) => {
      // console.log('page: ', page);
      const newHrefs = await getPageLinks(page);
      console.log('newHrefs: ', newHrefs);
    })
    .catch((error) => {
      console.log('there was an error?');
    });

  // await browser.close();
})();
