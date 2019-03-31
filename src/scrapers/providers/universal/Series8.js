const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const {absoluteUrl, padTvNumber} = require('../../../utils');
const BaseProvider = require('../BaseProvider');

module.exports = class Series8 extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://www2.seriesonline8.co'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const clientIp = this._getClientIp(req);
        const title = req.query.title.toLowerCase();
        const year = req.query.year;
        const season = req.query.season;
        const episode = req.query.episode;
        const type = req.query.type;
        const resolvePromises = [];
        const headers = {};

        try {
            let searchTitle = `${title}`;
            if (type == 'tv') {
                searchTitle = `${searchTitle} - season ${season}`;
            }
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const searchUrl = (`${url}/movie/search/${searchTitle.replace(/\s+/g, '-').replace(':', '')}`);
            const response = await this._createRequest(rp, searchUrl, jar, headers);
            
            let $ = cheerio.load(response);

            let videoPage = '';
            $(".ml-item").toArray().some(element => {
                let linkElement = $(element).find("a");
                let contentPage = `${url}${linkElement.attr('href')}/watching.html`;
                let posterTitle = linkElement.find('.mli-info h2').text().toLowerCase();
                
                if (posterTitle == searchTitle) {
                    videoPage = contentPage;
                }
            });
            if (!videoPage) {
                return Promise.resolve();
            }
            
            let videoPageHTML = await this._createRequest(rp, videoPage, jar, headers);

            $ = cheerio.load(videoPageHTML);

            $('.btn-eps').toArray().forEach(element => {
                if ((type == 'tv' && $(element).attr('episode-data') == episode) || type == 'movies') {
                    const providerLink = $(element).attr('player-data');
                    resolvePromises.push(this.resolveLink(providerLink, ws, jar, headers));
                }
            });
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
