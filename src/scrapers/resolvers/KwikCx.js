const BaseResolver = require('./_BaseResolver');

const cheerio = require('cheerio');
const vm = require('vm');

/**
 * A resolver that's used by Animepahe.
 * @type {module.KwikCx}
 */
module.exports = class KwikCx extends BaseResolver {

    /** @inheritdoc */
    supportsUri(uri) {
        return uri.includes('//kwik.cx/e');
    }

    /** @inheritdoc */
    _preprocessRequest(uri, jar, headers) {
        headers = super._preprocessRequest(uri, jar, headers);
        headers['Referer'] = this._generateReferer();
        return headers;
    }

    /** @inheritdoc */
    resolveHtml(meta, html, jar, headers) {
        let $ = cheerio.load(html);
        let script = $('script:contains("eval")').last()[0].children[0].data;

        let video = {
            src: null
        };

        const Hls = {
            isSupported() {
                return false;
            }
        };
        const document = {
            querySelector() {
                return video;
            }
        };

        const sandbox = this._getDefaultSandbox();
        sandbox['Plyr'] = this._createNativeProxyShim('Plyr', true);
        sandbox['document'] = document;
        sandbox['Hls'] = Hls;
        sandbox['dashjs'] = {
            MediaPlayer: function () {
                return {
                    create: function () {
                        return {
                            initialize: function (_video, source, extra) {
                                video.src = source;
                            }
                        }
                    }
                }
            }
        };

        vm.createContext(sandbox); // Contextify the sandbox.
        vm.runInContext(script, sandbox);

        const links = [];

        if (video.src) {
            links.push(
                {
                    data: video.src,
                    meta: {},
                }
            );
        }

        return this.processHtmlResults(meta, links);
    }

    /**
     * Generate referrer required for the embed to load.
     * TODO: We should be able to send metadata and headers over to the `resolve` function to use.
     *
     * @return {string}
     * @private
     */
    _generateReferer() {
        // Generate a random anime as the referrer so it's harder to track and block.
        const randomAnimes = [
            'asura', 'naruto',
            'jojo-no-kimyou-na-bouken',
            'kill-la-kill',
            'parasyte-the-maxim',
            'hunter-x-hunter-2011',
        ];

        const id = this._generateUniqueId();
        const anime = randomAnimes[Math.floor(Math.random() * randomAnimes.length)];

        // Generate url like:
        // https://animepahe.com/play/hunter-x-hunter-2011/16121d640b1f981cacff8dc6249bf74b1cd2cb33
        return `https://animepahe.com/play/${anime}/${id}`;
    }

    _generateUniqueId() {
        const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const stringLength = 40;

        function pickRandom() {
            return possible[Math.floor(Math.random() * possible.length)];
        }

        return Array.from({length: stringLength}, pickRandom).join('');
    }
};