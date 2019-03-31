const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');
const {timeout} = require('../../utils');
const logger = require('../../utils/logger');

async function Vidoza(uri, jar, {'user-agent': userAgent}) {
    try {
        let videoPageHtml = '';
        let attempt = 0;
        while(attempt < 5 && !videoPageHtml) {
            try {
                logger.debug(attempt, uri);
                videoPageHtml = await rp({
                    uri,
                    timeout: 5000
                });
                logger.debug('success', uri);
            } catch (err) {
                logger.error('fail', uri);
                await timeout(3000);
                attempt++;
            }
        }
    
        return VidozaHtml(videoPageHtml);
    } catch (err) {
        logger.error(err)
    }
}

function VidozaHtml(videoPageHtml) {
    if (videoPageHtml && videoPageHtml !== 'File was deleted') {
        $ = cheerio.load(videoPageHtml);

        const sandbox = {window: {}};
        vm.createContext(sandbox); // Contextify the sandbox.
        vm.runInContext($('script:contains("pData")')[0].children[0].data, sandbox);

        return sandbox.window.pData.sourcesCode;
    } else {
        throw 'Vidoza: File was deleted';
    }

}

module.exports = exports = {Vidoza, VidozaHtml};