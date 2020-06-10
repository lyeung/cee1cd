const express = require('express');
const bodyParser = require('body-parser');
const nodeGit = require('nodegit');

const fs = require('fs');
const {spawn} = require('child_process');
const dockerCli = require('docker-cli-js');

const app = express();
const port = process.env.PORT || 6000;

const workingDir = process.env.WORKING_DIR || '/tmp/workspace';

app.use(bodyParser.json());
app.post('/projects', (req, res, next) => {
  const {name, url} = req.body;
  console.log('name', name, 'url', url);
  res.status(200).send();
});
app.post('/builds', async (req, res, next) => {
  const branchName = req.body.branchName;
  console.log('branchName', branchName);
  if (!branchName) {
    res.status(400).send();
  }

  if (!fs.existsSync(workingDir)) {
    fs.mkdirSync(workingDir);
  }

  const repoUrl = 'https://github.com/lyeung/cee1cd';
  const localPath = require('path').join(workingDir);
  const cloneOpts = {};
  cloneOpts.fetchOpts = {
    callbacks: {
      certificateCheck: () => 0,
    },
  };

  try {
    const cloneRepo = await nodeGit.Clone(repoUrl, localPath, cloneOpts);
  } catch (err) {
    console.error(err);
  }
  try {
    const repo = await nodeGit.Repository.open(localPath);
    const refCommit = await repo.getBranch(`refs/remotes/origin/${branchName}`);
    await repo.checkoutRef(refCommit);
    const sha = await refCommit.sha();
    console.log('branch', name);
    res.status(200).send({
      bare: repo.isBare(),
      head: sha,
    });
  } catch (err) {
    console.error(err);
    res.status(400).send();
  }

  try {
    const child = spawn('yarn', {
      cwd: workingDir,
    });
    child.stderr.on('data', data => {
      console.log(`stderr ${data}`);
    });
    child.stdout.on('data', data => {
      console.log(`stdout: ${data}`);
    });
    child.on('exit', (code, signal) => {
      console.log(`exit code ${code} signal ${signal}`);
      const DockerOptions = dockerCli.Options;
      const opts = new DockerOptions(null, workingDir, true);
      const Docker = dockerCli.Docker;
      const docker = new Docker(opts);

      docker
        .command('build -f Dockerfile.test . -t cee1cd-node12')
        .then(data => {
          console.log(data);
          res.status(200).send();
        });
    });
    /*const docker = dockerCli.Docker;
    const data = await dockerCli.dockerCommand(
      'build -f Dockerfile.test . -t cee1cd-node12',
    );
    console.log(data);*/
  } catch (error) {
    console.log(error);
    res.status(400).send();
  }
});

app.listen(port, () => console.log(`listening at port ${port}`));
