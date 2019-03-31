const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');
const logger = require('../../utils/logger');
const normalizeUrl = require('../../utils').normalizeUrl;

async function Streamango(uri, jar, headers) {
    try {
        let providerPageHtml = await rp({
            uri,
            headers,
            jar,
            timeout: 5000
        });

        return StreamangoHtml(providerPageHtml);
    } catch (err) {
        logger.error(err)
    }
}

function StreamangoHtml(providerPageHtml) {
    let $ = cheerio.load(providerPageHtml);

    const jQuery = function (selector, anotherArg) {
        return {
            $(selector) {
                return $(selector);
            },
            ready(f) {
                f();
            },
            click() { },
            hide() { }
        }
    };

    // starting variables
    const sandbox = {
        $: jQuery,
        document: {},
        window: {},
    };
    vm.createContext(sandbox); // Contextify the sandbox.
    vm.runInContext($('script:contains(srces)')[0].children[0].data.replace('src:d(', 'src:window.d('), sandbox);

    return normalizeUrl(sandbox.srces[0].src, 'https');

}

module.exports = exports = { Streamango, StreamangoHtml };