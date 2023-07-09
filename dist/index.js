const core = require('@actions/core');
const github = require('@actions/github');
const artifact = require('@actions/artifact');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function run() {
  try {
    const sourceFolder = core.getInput('path');
    const filename = core.getInput('filename');
    const label = core.getInput('label');
    const shouldPush = core.getInput('push').toLowerCase() === 'true';
    const outputDir = core.getInput('output-dir');
    const pushMsg = core.getInput('push-msg').replace('%FILENAME%', filename);

    console.log('Doing prerequisites...');

    execSync('git config --global user.email "<your-email>"');
    execSync('git config --global user.name "<your-name>"');

    const repoName = github.context.repo.repo;
    const cloneDir = path.join('D:\\REPO', repoName);
    if (!fs.existsSync(cloneDir)) {
      fs.mkdirSync(cloneDir, { recursive: true });
    }
    const cloneCmd = `git clone https://github.com/${github.context.repo.owner}/${repoName}.git ${cloneDir}`;
    execSync(cloneCmd, { stdio: 'inherit' });

    console.log('Setting up ImgBurn...');

    process.chdir(cloneDir); // Change to the cloned repository directory

    const sourceFolderPath = path.join(cloneDir, sourceFolder);
    const isoFilePath = path.join(sourceFolderPath, filename);

    if (!fs.existsSync(isoFilePath)) {
      throw new Error(`File ${isoFilePath} does not exist.`);
    }

    execSync(`choco install imgburn -y`);
    const imgBurnPath = `"C:\\Program Files (x86)\\ImgBurn\\ImgBurn.exe"`;
    const imgBurnArgs = `/MODE BUILD /BUILDINPUTMODE FOLDER /BUILDOUTPUTMODE IMAGEFILE /SRC "${sourceFolderPath}" /DEST "${outputDir}\\${filename}" /FILESYSTEM "ISO9660 + Joliet" /VOLUMELABEL "${label}" /OVERWRITE YES /START /CLOSE /NOIMAGEDETAILS`;

    console.log(`Running ImgBurn with command: ${imgBurnPath} ${imgBurnArgs}`);

    execSync(`"${imgBurnPath}" ${imgBurnArgs}`, { stdio: 'inherit' });

    console.log('Disk image creation completed.');

    if (shouldPush) {
      console.log('Pushing changes to Git...');
      execSync('git add .');
      execSync(`git commit -m "${pushMsg}"`);
      execSync('git push');
      console.log('Changes pushed to Git.');
    }

    console.log('Uploading disk image as artifact...');
    const artifactClient = artifact.create();
    const artifactName = 'disk-image';
    const files = [`${outputDir}\\${filename}`];
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const rootDirectory = outputDir;
    const options = {
      continueOnError: false
    };
    const uploadResult = artifactClient.uploadArtifact(artifactName, files, rootDirectory, options);

    console.log('Disk image artifact uploaded.');

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
