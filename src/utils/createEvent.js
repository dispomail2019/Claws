const URL = require('url');

function createEvent(data, ipLocked, pairing, {quality, provider, source, isResultOfScrape = false, cookieRequired = '', cookie = ''}, headers) {
    if (ipLocked) {
        return {
            event: 'scrape',
            target: pairing.target,
            headers,
            provider,
            resolver: source,
            cookieRequired
        }
    }

    return {
        event: 'result',
        file: {
            data,
        },
        isResultOfScrape,
        metadata: {
            quality,
            provider,
            source,
            cookie
        },
        headers
    };
}

module.exports = exports = createEvent;
