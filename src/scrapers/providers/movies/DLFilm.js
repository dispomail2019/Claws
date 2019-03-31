const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');

module.exports = class DLFilm extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['http://dlfilm.net'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const year = req.query.year;
        const resolvePromises = [];
        let headers = {};
    
        try {
            const searchTitle = `${title} ${year}`;
            let searchUrl = this._generateUrl(`${url}/`, {
                s: searchTitle
            });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);
            
            let $ = cheerio.load(response);
            
            let videoPage = '';
            $('.posts').toArray().forEach(element => {
                let linkElement = $(element).find('.top a');

                let contentTitle = $(linkElement).attr('title').toLowerCase();
                let contentPage = $(linkElement).attr('href');

                if (contentTitle.includes(searchTitle)) {
                    videoPage = contentPage;
                }
            });

            if (!videoPage) {
                return Promise.resolve();
            }

            const videoPageHTML = await this._createRequest(rp, videoPage, jar, headers);

            $ = cheerio.load(videoPageHTML);

            $('.link_dl').toArray().forEach(element => {
                let videoLink = $(element).attr('href');
                resolvePromises.push(this.resolveLink(videoLink, ws, jar, headers));
            });
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
