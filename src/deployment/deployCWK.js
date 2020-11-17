const util = require('util');
const exec = util.promisify(require('child_process').exec);

exports.deployCWK = (folder, repo) => {
  return exec(
    `git pull https://${process.env.GITHUB_USER}:${process.env.GITHUB_PW}@github.com/${repo}`,
    {
      cwd: `/var/www/code-workshop-kit.com/${folder}`,
      shell: true,
    },
  );
};

exports.postDeploy = (folder, cmd) => {
  return exec(cmd, {
    cwd: `/var/www/code-workshop-kit.com/${folder}`,
    shell: true,
  });
};
