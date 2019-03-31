const rp = require('request-promise');
const cheerio = require('cheerio');
const logger = require('../../utils/logger');

async function RapidVideo(uri, jar) {
    try {
        let providerPageHtml = await rp({
            uri,
            jar,
            timeout: 5000
        });
    
        $ = cheerio.load(providerPageHtml);
    
        return $('source').attr('src');
    } catch (err) {
        logger.error(err)
    }
}

module.exports = exports = RapidVideo;