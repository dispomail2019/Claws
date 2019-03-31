const rp = require('request-promise');
const cheerio = require('cheerio');
const logger = require('../../utils/logger');

async function Vidlox(uri, jar, headers) {
    try {
        const videoSourceHtml = await rp({
            uri,
            headers,
            jar,
            timeout: 5000
        });
        let result;
        result = JSON.parse(/(?:sources:\s)(\[.*\])/g.exec(videoSourceHtml)[1]);
        return result
    }
    catch (err) {
        logger.error(err)
    }
}

module.exports = exports = Vidlox;