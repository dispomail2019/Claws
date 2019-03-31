const BaseResolver = require('./_BaseResolver');

const cheerio = require('cheerio');
const vm = require('vm');

const urlRegex = /((?:https?:\/\/)(flashx\.(?:tv|to|sx|cc|bz)))\/(?:embed-|dl\?|embed.php\?c=)?([0-9a-zA-Z]+)/;

module.exports = class FlashX extends BaseResolver {

    /** @inheritdoc */
    supportsUri(uri) {
        return uri.includes('flashx') && urlRegex.test(uri);
    }

    /** @inheritdoc */
    normalizeUri(uri) {
        if (!uri.includes('/embed')) {
            // we have a url like http://flashx.tv/xzrod3j5t7ft.html, convert it to an embed.
            const paths = urlRegex.exec(uri);
            if (paths) {
                // The .html suffix is required.
                return paths[1] + '/embed-' + paths[3] + '.html';
            }
        }
        return uri;
    }

    /** @inheritdoc */
    async resolveHtml(meta, html, jar, headers) {
        let match = /onclick="location\.href=['"](.*?)['"]/.exec(html);
        if (match && match[1]) {
            let videoHtml = await this.createRequest(match[1], jar, headers);
            return this.resolveVideoHtml(meta, videoHtml, jar, headers);
        }

        return [];
    }

    /** @inheritdoc */
    async resolveVideoHtml(meta, html, jar, headers) {
        let $ = cheerio.load(html);

        let script = $('script:contains("eval")').last()[0].children[0].data;
        const sandbox = {
            src: null,
        };
        vm.createContext(sandbox); // Contextify the sandbox.

        script = script.replace('eval(', 'var conf = (');
        script += ";\nsrc = eval('['+conf+']')";
        let result = vm.runInContext(script, sandbox);

        let links = [];

        result.forEach((entry) => {
            links.push({
                data: entry.src,
                meta: {
                    quality: entry.label, // e.g. SD
                    type: entry.type, // e.g. video/mp4
                }
            })
        });

        return await this.processHtmlResults(meta, links);
    }
};