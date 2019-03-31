const rp = require('request-promise');
const cheerio = require('cheerio');
const logger = require('../../utils/logger');

async function VShare(uri, jar, {'user-agent': userAgent}) {
    try {
        const videoSourceHtml = await rp({
            uri,
            headers: {
                'user-agent': userAgent
            },
            jar,
            timeout: 5000
        });
    
        return VShareHtml(videoSourceHtml);
    } catch (err) {
        logger.error(err);
    }
}

function VShareHtml(videoSourceHtml) {

    const $ = cheerio.load(videoSourceHtml);

    const source = $('source').attr('src');

    if (!source) {
        throw "File does not exist or has been removed";
    }

    return source;
}

module.exports = exports = {VShare, VShareHtml};