const fs = require('fs');
const path = require('path');

// Set the environment variable indicating that we're running a test.
process.env['CLAWS_TESTING'] = 'true';
process.env['CLAWS_DONT_RESOLVE_PROVIDERS'] = 'true';

function readTestAsset(file, prefix = './resources/') {
    let filePath = path.resolve(__dirname, prefix, file);
    return fs.readFileSync(filePath, 'utf8');
}

module.exports = {
    readTestAsset,
};