const { Octokit } = require('@octokit/rest');

module.exports = {
  octokit: new Octokit({
    auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  }),
};
