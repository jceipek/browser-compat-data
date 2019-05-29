const { octokit } = require('./kit.js');
const contributors = require('./contributors');

const allPulls = octokit.pulls.list.endpoint.merge({
  owner: 'mdn', repo: 'browser-compat-data', state: 'open', direction: 'asc',
});

async function* openPulls() {
  for await (const response of octokit.paginate.iterator(allPulls)) {
    yield* response.data;
  }
}

async function main() {
  try {
    const logins = new Set(await contributors.logins());

    const isFirstTimer = login => !logins.has(login);

    for await (const pull of openPulls()) {
      const link = `=HYPERLINK("${pull.html_url}", "#${pull.number}")`;
      const info = [
        pull.user.login,
        `${isFirstTimer(pull.user.login)}`.toUpperCase(),
        link,
      ];
      console.log(info.join('\t'));
    }
  } catch (exc) {
    console.trace(exc);
  }
}

if (require.main === module) {
  main();
}
