const rp = require('request-promise');
const cheerio = require('cheerio');
const logger = require('../../utils/logger');

async function EStream(uri, jar, clientIp, userAgent) {
    try {
        const videoPageHtml = await rp({
            uri,
            headers: {
                'user-agent': userAgent
            },
            jar,
            timeout: 5000
        });
    
        const $ = cheerio.load(videoPageHtml);
    
        return $('source').toArray().map((sourceElement) => $(sourceElement).attr('src'));
    } catch(err) {
        logger.error(err)
    }
}

module.exports = exports = EStream;