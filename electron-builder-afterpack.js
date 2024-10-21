const fs = require('fs');
const {exec} = require('child_process');

exports.default = async function(context) {

    const requirePath = (path) => {
        if (!fs.existsSync(path)) {
            throw new Error("Path does does not exist: " + path);
        }
    };

    const isLinux =
        context.targets.find(target => ['appImage', 'deb', 'snap', 'tar.gz'].includes(target.name));

    console.log({isLinux});

    if (!isLinux) {
        console.log("Not linux so skipping --no-sandbox changes");
        return;
    }

    console.log("Configuring gridtracker2 for --no-sandbox");

    const pathGridTracker2 = "dist/linux-unpacked/gridtracker2";
    const pathGridTracker2Bin = "dist/linux-unpacked/gridtracker2.bin";

    requirePath(pathGridTracker2);
    requirePath("dist/linux-unpacked/chrome-sandbox");

    fs.renameSync(pathGridTracker2, pathGridTracker2Bin);

    const wrapperScript = `#!/bin/bash
    SOURCE_FILE=$(readlink -f "\${BASH_SOURCE}")
    SOURCE_DIR=\${SOURCE_FILE%/*}
    "\${SOURCE_DIR}/gridtracker2.bin" "$@" --no-sandbox
  `;

    fs.writeFileSync(pathGridTracker2, wrapperScript);
    exec(`chmod +x ${pathGridTracker2}`);

};
