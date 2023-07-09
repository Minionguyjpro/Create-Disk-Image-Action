const core = require('@actions/core');
const github = require('@actions/github');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const artifact = require('@actions/artifact');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const sourceFolder = core.getInput('path');
    const filename = core.getInput('filename');
    const label = core.getInput('label');
    const shouldPush = core.getInput('push').toLowerCase() === 'true';
    const outputDir = core.getInput('output-dir');
    const pushMsg = core.getInput('push-msg');

    console.log('Doing prerequisites...');

    await exec(`git config --global user.email "${github.context.payload.pusher.email}"`);
    await exec(`git config --global user.name "${github.context.payload.pusher.name}"`);

    const cloneDir = '/github/workspace';
    await exec(`choco install imgburn -y`);
    await exec(`git clone https://github.com/${github.context.repo.owner}/${github.context.repo.repo}.git ${cloneDir}`);

    console.log('Setting up ImgBurn...');

    const imgBurnPath = `"${process.env['ProgramFiles(x86)']}\\ImgBurn\\ImgBurn.exe"`;
    const imgBurnArgs = `/MODE BUILD /BUILDINPUTMODE FOLDER /BUILDOUTPUTMODE IMAGEFILE /SRC "${sourceFolder}" /DEST "${outputDir}\\${filename}" /FILESYSTEM "ISO9660 + Joliet" /VOLUMELABEL "${label}" /OVERWRITE YES /START /CLOSE /NOIMAGEDETAILS`;

    console.log(`Running ImgBurn with command: ${imgBurnPath} ${imgBurnArgs}`);

    const { stdout, stderr } = await exec(`PowerShell -Command "& {${imgBurnPath} ${imgBurnArgs}}"`);

    console.log('Disk image creation completed.');

    if (shouldPush) {
      console.log('Pushing changes to Git...');
      process.chdir(cloneDir);
      await exec('git add .');
      await exec(`git commit -m "${pushMsg}"`);
      await exec('git push');
      console.log('Changes pushed to Git.');
    }

    console.log('Uploading disk image as artifact...');
    const artifactClient = artifact.create();
    const artifactName = 'disk-image';
    const files = [`${outputDir}\\${filename}`];
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    const rootDirectory = outputDir;
    const options = {
      continueOnError: false
    };
    const uploadResult = await artifactClient.uploadArtifact(artifactName, files, rootDirectory, options);

    console.log('Disk image artifact uploaded.');

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
