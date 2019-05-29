const auth = {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
};

const Octokit = require('@octokit/rest');

module.exports = {
  octokit: new Octokit({ auth }),
};
