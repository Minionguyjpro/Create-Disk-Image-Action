const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const path = core.getInput('path');
    const outputDir = core.getInput('output-dir');
    const filename = core.getInput('filename');
    const label = core.getInput('label');

    console.log('Doing prerequisites...');

    console.log('Installing ImgBurn...');
    await exec.exec('choco install imgburn -y');

    console.log('Cloning repository...');
    await exec.exec('actions/checkout@v3');

    console.log('Creating disk image...');
    await exec.exec(`& "$Env:PROGRAMFILES (x86)\\ImgBurn\\ImgBurn.exe" /MODE "BUILD" /BUILDINPUTMODE "STANDARD" /BUILDOUTPUTMODE "IMAGEFILE" /SRC "${path}" /DEST "${outputDir}\\${filename}" /FILESYSTEM "ISO9660 + Joliet" /VOLUMELABEL_ISO9660 "${label}" /VOLUMELABEL_JOLIET "${label}" /OVERWRITE YES /ROOTFOLDER YES /START /CLOSE /NOIMAGEDETAILS`);

    console.log('Setting \'\\\' to \'/\'...');
    let diskOutputDir = outputDir;
    console.log(`The variable is set to '${diskOutputDir}'`);
    if (diskOutputDir.includes('\\')) {
      diskOutputDir = diskOutputDir.replace('\\', '/');
      console.log(`And now the variable is set to '${diskOutputDir}'`);
    }

    console.log(`Uploading disk image binary as an artifact...`);
    await artifactClient.uploadArtifact(filename, [`${diskOutputDir}/${filename}`], diskOutputDir);

    console.log(`Pushing changes to Git...`);
    await exec.exec(`git config --global user.name '${github.context.actor}'`);
    await exec.exec(`git config --global user.email '${github.context.actor}@users.noreply.github.com'`);
    await exec.exec(`git fetch`);
    await exec.exec(`git add -A`);
    process.env.FILENAME = filename;
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
