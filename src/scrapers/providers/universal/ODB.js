const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const BaseProvider = require('../BaseProvider');
const tough = require('tough-cookie');

module.exports = class ODB extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ["https://api.odb.to"];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const year = req.query.year;
        const season = req.query.season;
        const episode = req.query.episode;
        const type = req.query.type;
        const resolvePromises = [];
        const headers = {};

        try {
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            let searchUrl = this._generateUrl(`${url}/embed`, {
                title: title,
                year: year
            });
            if (type == 'tv') {
                searchUrl += `&s=${season}&e=${episode}`;
            }
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            let resolverLink = $('iframe').attr('src');
            if (!resolverLink) {
                return Promise.resolve();
            }

            resolvePromises.push(this.resolveLink(resolverLink, ws, jar, headers));
        }
        catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}