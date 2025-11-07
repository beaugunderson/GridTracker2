const fs = require('fs');
const path = require('path');

const { exec } = require('child_process');

exports.default = async function (context) {
  const appOutDir = context.appOutDir;

  const requirePath = (path) => {
    if (!fs.existsSync(path)) {
      throw new Error('Path does does not exist: ' + path);
    }
  };

  const isLinux = context.targets.find((target) =>
    ['appImage', 'rpm', 'deb', 'snap', 'pacman', 'tar.gz'].includes(target.name),
  );
  const isNsis = context.targets.find((target) => ['nsis'].includes(target.name));

  if (isNsis) {
    console.log('Patching stupid NSIS installer script');
    const nsisScriptPath = path.join(
      context.outDir,
      '../node_modules/app-builder-lib/templates/nsis/include/installUtil.nsh',
    );
    requirePath(nsisScriptPath);
    const patch =
      '\r\n!macroundef handleUninstallResult\r\n!macroundef uninstallOldVersion\r\n!macro handleUninstallResult ROOT_KEY\r\n!macroend\r\n!macro uninstallOldVersion ROOT_KEY\r\n!macroend\r\n';
    fs.appendFileSync(nsisScriptPath, patch);
  }

  if (isLinux) {
    console.log('Configuring for --no-sandbox');

    const pathGridTracker2 = path.join(appOutDir, 'gridtracker2');
    const pathGridTracker2Bin = path.join(appOutDir, 'gridtracker2.bin');

    requirePath(pathGridTracker2);
    requirePath(path.join(appOutDir, 'chrome-sandbox'));

    fs.renameSync(pathGridTracker2, pathGridTracker2Bin);

    const wrapperScript =
      '#!/bin/bash\nSOURCE_DIR=\`realpath $0\`\nSOURCE_DIR=\`dirname ${SOURCE_DIR}\`\n${SOURCE_DIR}/gridtracker2.bin "$@" --no-sandbox --enable-speech-dispatcher\n';

    fs.writeFileSync(pathGridTracker2, wrapperScript);
    exec(`chmod +x ${pathGridTracker2}`);
  }
};
