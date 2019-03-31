const BaseResolver = require('./_BaseResolver');

const cheerio = require('cheerio');
const vm = require('vm');

const urlRegex = /https?:\/\/vidstreaming\.io\/(?:embed|streaming)\.php\?id=([0-9A-Za-z]+)/;

module.exports = class VidStreaming extends BaseResolver {

    /** @inheritdoc */
    supportsUri(uri) {
        return uri.includes('vidstreaming.io') && urlRegex.test(uri);
    }

    /** @inheritdoc */
    resolveHtml(meta, html, jar, headers) {
        let $ = cheerio.load(html);
        /*
        // vidstreaming sometimes comes with alternative mirror links.
        let altServerLinks = $('#list-server-more .linkserver[data-status="1"][data-video]').filter((i, entry) => {
            // Alternative server links. Not needed yet, but can be used to get more links from alternative providers.
            // Can potentially be used to add it to the resolve queue (but be careful of potential infinite loops)
            return !entry.attribs['data-video'].includes('vidstreaming');
        });
        */

        let script = $('script:contains(jwplayer)').get()[0].children[0].data;

        let jwPlayerConfig;
        let jQuery = this._getJqueryShim($);
        const sandbox = this._getDefaultSandbox(jQuery, this._getJwPlayerShim((config) => {
            jwPlayerConfig = config;
        }));
        vm.createContext(sandbox); // Contextify the sandbox.
        vm.runInContext(script, sandbox);

        let links = this._resolveJwPlayerLinks(jwPlayerConfig, meta);

        return this.processHtmlResults(meta, links);
    }
};