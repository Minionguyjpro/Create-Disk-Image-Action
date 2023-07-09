const core = require('@actions/core');
const github = require('@actions/github');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const artifact = require('@actions/artifact');
const fs = require('fs');

async function run() {
  try {
    const path = core.getInput('path');
    const outputDir = core.getInput('output-dir');
    const filename = core.getInput('filename');

    console.log('Doing prerequisites...');

    await exec(`git config --global user.email "${github.context.payload.pusher.email}"`);
    await exec(`git config --global user.name "${github.context.payload.pusher.name}"`);
    await exec(`choco install imgburn -y`);
    await exec(`git clone https://github.com/${github.context.repo.owner}/${github.context.repo.repo}.git /github/workspace`);
    process.chdir('/github/workspace');

    console.log('Creating disk image...');
    const imgBurnPath = `"${process.env['ProgramFiles(x86)']}\\ImgBurn\\ImgBurn.exe"`;
    const imgBurnArgs = `/MODE BUILD /BUILDINPUTMODE STANDARD /BUILDOUTPUTMODE IMAGEFILE /SRC "${path}" /DEST "${outputDir}/${filename}" /FILESYSTEM "ISO9660 + Joliet" /OVERWRITE YES /ROOTFOLDER YES /START /CLOSE /NOIMAGEDETAILS`;
    console.log(`Running ImgBurn with command: ${imgBurnPath} ${imgBurnArgs}`);
    const { stdout, stderr } = await exec(`PowerShell -Command "& {${imgBurnPath} ${imgBurnArgs}}`);

    console.log('Uploading disk image as artifact...');
    const artifactClient = artifact.create();
    const artifactName = 'disk-image';
    const files = [`${outputDir}/${filename}`];
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    const rootDirectory = outputDir;
    const options = {
      continueOnError: false
    };
    const uploadResult = await artifactClient.uploadArtifact(artifactName, files, rootDirectory, options);
    
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
