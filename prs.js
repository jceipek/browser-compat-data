#!/usr/bin/env node

const fs = require('fs');

const yargs = require('yargs');

const { octokit } = require('./kit.js');
const contributors = require('./contributors');

const allPulls = octokit.pulls.list.endpoint.merge({
  owner: 'mdn',
  repo: 'browser-compat-data',
  state: 'open',
  direction: 'asc',
});

async function* openPulls() {
  for await (const response of octokit.paginate.iterator(allPulls)) {
    yield* response.data;
  }
}

async function fetchPrDataFromFile() {
  const path = 'prdata.json';
  let timeDiff;

  try {
    const { mtime } = fs.statSync(path);
    timeDiff = new Date() - new Date(mtime);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null;
    }
    console.trace(err);
  }

  // 3600000 is one hour in miliseconds
  if (timeDiff < 3600000) {
    return JSON.parse(fs.readFileSync(path));
  }
  fs.unlinkSync(path);
  return null;
}

async function fetchPrDataFromGitHub() {
  const logins = new Set(await contributors.logins());
  const isFirstTimer = login => !logins.has(login);

  const data = [];

  for await (const pull of openPulls()) {
    data.push({
      pull_url: pull.html_url,
      author: pull.user.login,
      isFirstTimer: isFirstTimer(pull.user.login),
    });
  }

  return data;
}

async function getPrData(force = false) {
  const fromFile = await fetchPrDataFromFile();
  if (force === true || fromFile === null) {
    const data = await fetchPrDataFromGitHub();
    fs.writeFileSync('prdata.json', JSON.stringify(data));
    return data;
  }
  return fromFile;
}

function tabbed(args) {
  return args.join('\t');
}

function hyperlink(pull_url) {
  const number = pull_url.match(
    /https:\/\/github\.com\/.*?\/.*?\/pull\/(\d+)/,
  )[1];

  return `=HYPERLINK("${pull_url}", "#${number}")`;
}

async function main() {
  try {
    yargs
      .command(
        'fetch',
        'get PR data',
        () => {},
        async () => {
          console.log('Getting PR data…');
          await getPrData(true);
          console.log('Done.');
        },
      )
      .command(
        'all',
        'print all spreadsheet data',
        () => {},
        async () => {
          for (const { pull_url, author, isFirstTimer } of await getPrData()) {
            const firstTimer = isFirstTimer.toString().toUpperCase();
            console.log(tabbed([hyperlink(pull_url), author, firstTimer]));
          }
        },
      )
      .command(
        'pulls',
        'print pull links only',
        () => {},
        async () => {
          for (const { pull_url } of await getPrData()) {
            console.log(tabbed([hyperlink(pull_url)]));
          }
        },
      ).argv;
  } catch (exc) {
    console.trace(exc);
  }
}

if (require.main === module) {
  main();
}
