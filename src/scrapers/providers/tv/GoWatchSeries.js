const Promise = require('bluebird');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const { padTvNumber } = require('../../../utils');
const BaseProvider = require('../BaseProvider');

module.exports = class GoWatchSeries extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://gowatchseries.co'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const clientIp = req.client.remoteAddress.replace('::ffff:', '').replace('::1', '');
        const showTitle = req.query.title.toLowerCase();
        const { season, episode, year } = req.query;
        const rp = this._getRequest(req, ws);
        const jar = rp.jar();
        const resolvePromises = [];
        const userAgent = randomUseragent.getRandom();
        const headers = {
            'user-agent': userAgent,
            'x-real-ip': req.client.remoteAddress,
            'x-forwarded-for': req.client.remoteAddress
        }

        try {
            const searchUrl = showTitle.replace(/ /, '%20');
            const response = await this._createRequest(rp, `${url}/search.html?keyword=${searchUrl}`, jar, headers);
            let $ = cheerio.load(response);

            const escapedShowTitle = showTitle.replace(/[^a-zA-Z0-9]+/g, '-');
            let isPadded = true;
            const paddedSeason = padTvNumber(season);
            let linkText = `${escapedShowTitle}-${year}-season-${paddedSeason}`;
            let seasonLinkElement = $(`a[href="/info/${linkText}"]`);
            if (!seasonLinkElement.length) {
                isPadded = false;
                linkText = `${escapedShowTitle}-${year}-season-${season}`;
                seasonLinkElement = $(`a[href="/info/${linkText}"]`);
                if (!seasonLinkElement.length) {
                    isPadded = true;
                    linkText = `${escapedShowTitle}-season-${paddedSeason}`;
                    seasonLinkElement = $(`a[href="/info/${linkText}"]`);
                    if (!seasonLinkElement.length) {
                        isPadded = false;
                        linkText = `${escapedShowTitle}-season-${season}`;
                        seasonLinkElement = $(`a[href="/info/${linkText}"]`);
                    }
                }
            }
            if (!seasonLinkElement.length) {
                // No season link.
                this.logger.debug('GoWatchSeries', `Could not find: ${showTitle} (${year}) Season ${season}`);
                return Promise.resolve();
            }

            linkText += `-episode-${isPadded ? padTvNumber(episode) : episode}`;

            const episodeLink = `${url}/${linkText}`;

            const episodePageHtml = await this._createRequest(rp, episodeLink, jar, headers);
            $ = cheerio.load(episodePageHtml);
            const videoDiv = $('.play-video');
            const otherVideoLinks = $('.anime_muti_link');
            const iframeLinks = [];

            otherVideoLinks.children().toArray().forEach((c) => {
                if (c.name === 'ul') {
                    c.children.forEach((t) => {
                        if (t.name === 'li') {
                            iframeLinks.push(t.attribs['data-video'])
                        }
                    })
                }
            });

            iframeLinks.forEach((link) => {
                const headers = {
                    'user-agent': userAgent,
                    'x-real-ip': clientIp,
                    'x-forwarded-for': clientIp
                };
                resolvePromises.push(this.resolveLink(link, ws, jar, headers));
            });

        } catch (err) {
            this._onErrorOccurred(err);
        }
        return Promise.all(resolvePromises);
    }
}