const rp = require('request-promise');
const logger = require('../../utils/logger');

async function StreamM4u(uri, jar, headers) {
    try {
        let response = await rp({
            uri,
            headers,
            jar,
            simple: false,
            resolveWithFullResponse: true,
            followRedirect: false,
            timeout: 5000,
        });
    
        const sourceUrl = response.headers['location'].split('|')[0];
    
        return sourceUrl;
    } catch (err) {
        logger.error(err)
    }
}

module.exports = exports = StreamM4u;