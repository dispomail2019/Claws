const BaseResolver = require('./_BaseResolver');

const cheerio = require('cheerio');

module.exports = class StreamMoe extends BaseResolver {

    /** @inheritdoc */
    supportsUri(uri) {
        return uri.includes('stream.moe/embed');
    }

    /** @inheritdoc */
    resolveHtml(meta, html, jar, headers) {
        let $ = cheerio.load(html);
        let script = $('script:contains(var contents)').last()[0].children[0].data;

        let links = [];
        const matches = /var contents = atob\((['"])(.*)\1\)/g.exec(script);
        if (matches) {
            let decodedHtml = Buffer.from(matches[2], 'base64').toString();
            let $html = cheerio.load(decodedHtml);

            links.push({
                data: $html('video source').attr('src'),
                meta: meta,
            });
        }

        return this.processHtmlResults(meta, links);
    }
};