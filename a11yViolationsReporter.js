/* eslint no-console: 0 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('./config');
const { errorsExceedThreshold, dec } = require('./utils');

const violatingPages = [];
const violations = [];
const { logColors } = config;
const reportSummary = () => {
  console.log(
    `${logColors.blue}%s${logColors.reset}`,
    '\n--------------Accessibility Audit--------------'
  );
  console.log(
    violatingPages.length ? logColors.red : logColors.green,
    `Found ${violatingPages.length} Page${violatingPages.length === 1 ? '' : 's'} with Accessibility Errors
    \n ${violations.length} violation${violations.length === 1 ? '' : 's'} in total`
  );
  console.log(
    `${logColors.blue}%s${logColors.reset}`,
    '------------------------------------------------------------\n'
  );
};

const logOutput = testPages => {
  if (testPages.length > 0) {
    testPages.forEach(page => {
      if (page.violations.length === 0) {
        return;
      }
      violatingPages.push(page);
      page.violations.forEach(v => {
        violations.push(v);
      });
      console.log(
        `${logColors.yellow}%s${logColors.reset}`,
        `${page.violations.length} error${page.violations.length === 1 ? '' : 's'} found in: ${page.page}`
      );
      const inlineMsg = `\n${page.violations
        .map(
          (v, idx) =>
            `${idx + 1}) ${v.help} -- ${v.helpUrl.replace('?application=webdriverjs', '')} -- impact: ${v.impact}`
        )
        .join('\n')}
      `;
      console.log(inlineMsg);
      console.log('-------html violation instances-------');
      const nodesSummary = `\n${page.violations.map(v => v.nodes.map(el => el.html).join('\n')).join('\n')}`;
      console.log(nodesSummary, '\n');
    });
  } else {
    console.log(`${logColors.green}%s${logColors.reset}`, 'No A11y violations found \n');
  }
};

const updateTravisCIStatus = (status, description) => {
  const sha = process.env.TRAVIS_PULL_REQUEST_SHA || process.env.TRAVIS_COMMIT;
  const repoSlug = process.env.TRAVIS_REPO_SLUG;
  const githubToken = dec(process.env.GITHUB_A11Y_TOKEN);
  const buildId = process.env.TRAVIS_BUILD_ID;
  const url = `https://api.github.com/repos/${repoSlug}/statuses/${sha}?access_token=${githubToken}`;

  return axios
    .post(url, {
      state: status,
      context: 'Accessibility Reporter',
      description,
      target_url: `https://travis-ci.com/${repoSlug}/builds/${buildId}`
    })
    .catch(error => {
      console.log(error);
    });
};

const violationsReporter = (testPages, reportType) => {
  const reportPromise = new Promise((resolve, reject) => {
    switch (reportType) {
      case 'json':
        console.log(JSON.stringify(testPages, null, 2));
        resolve();
        break;
      case 'writefile': {
        const location = path.resolve(__dirname, 'a11y_violations.json');
        fs.writeFileSync(location, JSON.stringify(testPages, null, 2));
        console.log(`${logColors.yellow}%s${logColors.reset}`, `Raw audit data available at: ${location}\n`);
        resolve();
        break;
      }
      case 'github-status-reporter': {
        const overErrorLimit = errorsExceedThreshold(violations.length, config.toleranceThreshold);
        const status = overErrorLimit ? 'failure' : 'success';
        const description = overErrorLimit ? 'Too many accessibility violations' : 'A11y Checks Pass!';
        updateTravisCIStatus(status, description)
          .then(() => {
            resolve();
          })
          .catch(error => {
            reject(error);
          });
        break;
      }
      default: {
        logOutput(testPages);
        resolve();
      }
    }
  });

  return reportPromise;
};

module.exports = {
  a11yReporter: {
    report: errors =>
      violationsReporter(errors, 'default')
        .then(() => {
          reportSummary();
        })
        .then(() => {
          const finalReportType = !process.env.CI ? 'writefile' : 'github-status-reporter';
          return violationsReporter(errors, finalReportType);
        })
        .then(() => violations),
    updateTravisCIStatus
  }
};
