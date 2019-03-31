const BaseResolver = require('./_BaseResolver');

const cheerio = require('cheerio');
const vm = require('vm');

const urlRegex = /(https?:\/\/(?:www.)?xstreamcdn.com)\/v\/([0-9a-zA-Z]+?)(\.html)?$/;

module.exports = class XStreamCDN extends BaseResolver {

    /** @inheritdoc */
    supportsUri(uri) {
        return uri.includes('xstreamcdn.com') && urlRegex.test(uri);
    }

    /** @inheritdoc */
    _preprocessRequest(uri, jar, headers, extraOptions = {}) {
        headers = super._preprocessRequest(uri, jar, headers, extraOptions);
        if (!headers['Referer']) {
            headers['Referer'] = extraOptions['clawsOriginalUri'];
        }

        extraOptions['method'] = 'POST';
        extraOptions['body'] = {
            r: '',// Referer
            d: 'www.xstreamcdn.com', // hostname
        };
        extraOptions['json'] = true;

        return headers;
    }

    /** @inheritdoc */
    normalizeUri(uri) {
        // Convert https://www.xstreamcdn.com/v/4dvj6nwny91.html to
        // https://www.xstreamcdn.com/api/source/4dvj6nwny91.html.
        const paths = urlRegex.exec(uri);
        if (paths) {
            // The .html suffix is required.
            return paths[1] + '/api/source/' + paths[2] + '.html';
        }
        return uri;
    }

    /** @inheritdoc */
    resolveHtml(meta, json, jar, headers) {
        let content = typeof json === 'string' ? JSON.parse(json) : json;
        let links = [];
        if (Array.isArray(content.data)) {
            for (let link of content.data) {
                links.push({
                    data: link.file,
                    meta: {
                        quality: link.label, // e.g. 480p
                        type: link.type, // e.g. mp4
                    }
                })
            }
        }

        return this.processHtmlResults(meta, links);
    }
};