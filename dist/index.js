const core = require('@actions/core');
const github = require('@actions/github');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const artifact = require('@actions/artifact');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const sourcePath = core.getInput('path');
    const outputDir = core.getInput('output-dir');
    const filename = core.getInput('filename');

    console.log('Doing prerequisites...');

    await exec(`git config --global user.email "${github.context.payload.pusher.email}"`);
    await exec(`git config --global user.name "${github.context.payload.pusher.name}"`);

    const cloneDir = '/github/workspace';
    await exec(`choco install imgburn -y`);
    await exec(`git clone https://github.com/${github.context.repo.owner}/${github.context.repo.repo}.git ${cloneDir}`);
    process.chdir(cloneDir);

    console.log('Cloned repository contents:');
    const { stdout: lsOutput } = await exec('ls -la');
    console.log(lsOutput);

    console.log('Creating disk image...');
    const absolutePath = path.resolve(sourcePath, filename);
    console.log('Absolute file path:', absolutePath);

    const imgBurnPath = `"${process.env['ProgramFiles(x86)']}\\ImgBurn\\ImgBurn.exe"`;
    const imgBurnArgs = `/MODE BUILD /BUILDINPUTMODE STANDARD /BUILDOUTPUTMODE IMAGEFILE /SRC "${absolutePath}" /DEST "${outputDir}/${filename}" /FILESYSTEM "ISO9660 + Joliet" /OVERWRITE YES /ROOTFOLDER YES /START /CLOSE /NOIMAGEDETAILS`;
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
