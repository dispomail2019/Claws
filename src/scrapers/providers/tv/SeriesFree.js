const Promise = require('bluebird');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const BaseProvider = require('../BaseProvider');

module.exports = class SeriesFree extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://seriesfree.to'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const clientIp = this._getClientIp(req);
        const showTitle = req.query.title;
        const { season, episode, year, type } = req.query;
        let resolvePromises = [];
        const headers = {
            'user-agent': this.userAgent,
            'x-real-ip': this.clientIp,
            'x-forwarded-for': this.clientIp
        };

        try {
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const searchTitle = showTitle.replace(/\s+/g, '%20');
            const response = await this._createRequest(rp, `${url}/search/${searchTitle}`, jar, { 'user-agent': userAgent })
            let $ = cheerio.load(response);

            let showUrl = '';
            $('.serie-title').toArray().some(element => {
                if ($(element).text() === `${showTitle} (${year})` || $(element).text() === showTitle) {
                    showUrl = `${url}${$(element).parent().attr('href')}`;
                    return true;
                }
                return false;
            });
            if (!showUrl) {
                return Promise.resolve();
            }

            const videoPageHtml = await this._createRequest(rp, showUrl, jar, { 'user-agent': userAgent });
            $ = cheerio.load(videoPageHtml);

            let episodeUrl;
            $('.sinfo').toArray().some(element => {
                if ($(element).text() === `${season}×${episode}`) {
                    episodeUrl = `${url}${$(element).parent().attr('href')}`;
                    return true;
                }
                return false;
            });

            if (!episodeUrl) {
                this.logger.debug('SeriesFree', `Could not find: ${showTitle} ${season}×${episode}`);
                return Promise.resolve();
            }

            const episodePageHtml = await this._createRequest(rp, episodeUrl, jar, { 'user-agent': userAgent });
            $ = cheerio.load(episodePageHtml);

            const videoUrls = $('.watch-btn').toArray().map(element => `${url}${$(element).attr('href')}`);
            videoUrls.forEach((videoUrl) => {
                resolvePromises.push(this.scrapeHarder(rp, videoUrl, userAgent, clientIp, ws, jar));
            });
        } catch (err) {
            this._onErrorOccurred(err);
        }
        return Promise.all(resolvePromises);
    }

    async scrapeHarder(rp, videoUrl, userAgent, clientIp, ws, jar) {
        try {
            const videoPageHtml = await this._createRequest(rp, videoUrl, jar, { 'user-agent': userAgent })
            const $ = cheerio.load(videoPageHtml);
            const providerUrl = $('.action-btn').attr('href');
            const headers = {
                'user-agent': userAgent,
                'x-real-ip': clientIp,
                'x-forwarded-for': clientIp
            };

            return this.resolveLink(providerUrl, ws, jar, headers)
        } catch (err) {
            this._onErrorOccurred(err)
        }
    }
}