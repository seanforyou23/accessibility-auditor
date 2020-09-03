/* eslint no-console: 0 */
const selenium = require('selenium-webdriver');
const AxeBuilder = require('axe-webdriverjs');

const sitemap = require('./sitemap');
const { a11yReporter } = require('./a11yViolationsReporter');
const config = require('./config');

const { protocol } = config;
const { host } = config;
const { port } = config;
const violatingPages = [];
let chromeOptions = {};

if (process.env.CI) {
  chromeOptions = { args: ['--headless'] };
} else {
  chromeOptions = { args: ['--incognito', '--window-size=768,1024'] };
}

const chromeCapabilities = selenium.Capabilities.chrome();
chromeCapabilities.set('chromeOptions', chromeOptions);
const driver = new selenium.Builder()
  .forBrowser('chrome')
  .withCapabilities(chromeCapabilities)
  .build();

function runAxe(pagePath, res, rej) {
  return AxeBuilder(driver)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'section508'])
    .disableRules('color-contrast')
    // .withRules('color-contrast')
    .analyze()
    .then(results => {

      if (results.violations.length > 0) {
        violatingPages.push({
          page: pagePath,
          violations: results.violations
        });
      }
      res();
    })
    .catch(error => {
      rej(error);
    });
}

function domReflowBuffer(testPage, res, rej) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ path: testPage.path, res, rej });
    }, 250);
  });
}

const testPageA11y = testPage =>
  new Promise((resolve, reject) => {

    const isExternalResource = testPage.path.startsWith('http');

    if (isExternalResource) {
      console.log('Testing public resource: ', testPage.path);
      driver.get(testPage.path);
    } else {
      driver.get(`${protocol}://${host}:${port}${testPage.path}`);
    }

    return (
      driver
        // wait for specific elements to become available
        .wait(selenium.until.elementLocated(selenium.By.css('.page-loader-wrapper.loaded'), 10000)) // WordPress apps
        // .wait(selenium.until.elementLocated(selenium.By.css('.pf-c-page'), 10000)) // PatternFly apps
        // allow time for the repaint/relow so styles are applied before we analyze the page
        .then(() => domReflowBuffer(testPage, resolve, reject))
        .then(({ path, res, rej }) => runAxe(path, res, rej))
        .catch(error => {
          reject(error);
        })
    );
  });

if (process.env.CI) {
  a11yReporter.updateTravisCIStatus('pending', 'Running A11y Audit');
}

sitemap
  .filter((page) => page.path.indexOf('/uploads/') !== -1 ? false : true) // filter static assets from uploads dir
  .reduce((prevPromise, nextPage) => prevPromise.then(() => testPageA11y(nextPage)), Promise.resolve())
  .then(_ => {
    driver.quit().then(() => {
      const totalViolationsPromise = a11yReporter.report(violatingPages);
    });
  })
  .catch(error => {
    driver.quit().then(() => {
      console.log(`Test Runner ERROR: ${error}`);
      process.exit(1);
    });
  });
