const core = require('@actions/core');
const github = require('@actions/github');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const artifact = require('@actions/artifact');

async function run() {
  try {
    const path = core.getInput('path');
    const outputDir = core.getInput('output-dir');
    const filename = core.getInput('filename');
    const label = core.getInput('label');

    console.log(`path: ${path}`);
    console.log(`outputDir: ${outputDir}`);
    console.log(`filename: ${filename}`);
    console.log(`label: ${label}`);

    console.log('Doing prerequisites...');

    console.log('Installing ImgBurn...');
    await exec('choco install imgburn -y');

    console.log('Cloning repository...');
    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;
    const repoPath = '/path/to/repo'; // Replace with the path where you want to clone the repository
    await exec(`git clone https://github.com/${owner}/${repo}.git ${repoPath}`);

    console.log('Creating disk image...');
    const imgBurnPath = `"%ProgramFiles(x86)%\\ImgBurn\\ImgBurn.exe"`;
    const imgBurnArgs = `/MODE BUILD /BUILDINPUTMODE STANDARD /BUILDOUTPUTMODE IMAGEFILE /SRC "${path}" /DEST "${outputDir}\\${filename}" /FILESYSTEM "ISO9660 + Joliet" /VOLUMELABEL_ISO9660 "${label}" /VOLUMELABEL_JOLIET "${label}" /OVERWRITE YES /ROOTFOLDER YES /START /CLOSE /NOIMAGEDETAILS`;
    console.log(`Running ImgBurn with command: ${imgBurnPath} ${imgBurnArgs}`);
    const { stdout, stderr } = await exec(`${imgBurnPath} ${imgBurnArgs}`);
    console.log(`ImgBurn stdout: ${stdout}`);
    console.log(`ImgBurn stderr: ${stderr}`);

    console.log('Setting \'\\\' to \'/\'...');
    let diskOutputDir = outputDir;
    console.log(`The variable is set to '${diskOutputDir}'`);
    if (diskOutputDir.includes('\\')) {
      diskOutputDir = diskOutputDir.replace('\\', '/');
      console.log(`And now the variable is set to '${diskOutputDir}'`);
      core.setOutput('disk-output-dir', diskOutputDir);
      console.log(`The output variable is set to '${diskOutputDir}'`);
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
