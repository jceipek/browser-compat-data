const { octokit } = require('./kit.js');

const endpoint = octokit.repos.listContributors.endpoint.merge({
  owner: 'mdn',
  repo: 'browser-compat-data',
});

async function* fetch() {
  for await (const response of octokit.paginate.iterator(endpoint)) {
    for (const contributor of response.data) {
      yield contributor.login;
    }
  }
}

async function logins() {
  const arr = [];

  for await (const login of fetch()) {
    arr.push(login);
  }

  return arr;
}

if (require.main === module) {
  (async () => {
    for (const l of await logins()) {
      console.log(l);
    }
  })();
}

module.exports = {
  fetch,
  logins,
};
