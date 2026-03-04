const cp = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const cache = path.join(os.homedir(), 'AppData', 'Local', 'electron-builder', 'Cache', 'winCodeSign');
const zip = path.join(cache, 'winCodeSign-2.6.0.7z');
const dest = path.join(cache, 'winCodeSign-2.6.0');
const exe = path.resolve('node_modules', '7zip-bin', 'win', 'x64', '7za.exe');

console.log('Extracting...', zip, 'to', dest);
try {
    cp.execSync(`"${exe}" x -snld -bd "${zip}" -o"${dest}"`);
} catch (e) {
    console.log('Extraction threw an error (expected for macOS symlinks on Windows):', e.message);
}

if (fs.existsSync(dest)) {
    console.log('Destination folder exists. Assuming success.');
} else {
    console.log('Destination folder not found!');
}
