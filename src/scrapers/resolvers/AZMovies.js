const rp = require('request-promise');
const cheerio = require('cheerio');
const logger = require('../../utils/logger');

async function AZMovies(uri, jar, headers) {
    try {
        const videoPageHtml = await rp({
            uri: uri,
            headers,
            jar,
            timeout: 5000
        });

        const videoSrcUrl = /(?:src: ')(.*)(?:')/g.exec(videoPageHtml)[1];
        const videoStreamFileUrl = `https://files.azmovies.co/${videoSrcUrl}`;
        const videoStreamFile = await rp({
            uri: videoStreamFileUrl,
            headers,
            jar,
            timeout: 5000
        });

        const streamUrl = videoStreamFileUrl.substr(0, videoStreamFileUrl.lastIndexOf('/') + 1);
        const m3u8File = Buffer.from(videoStreamFile.replace(/\n(.*)(az\d\d\d\.ts)/g, `\n${streamUrl}$1$2`)).toString('base64');

        return m3u8File;

    } catch (err) {
        logger.error(err)
    }
}

module.exports = exports = AZMovies;