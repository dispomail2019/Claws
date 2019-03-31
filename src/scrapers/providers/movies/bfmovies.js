const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');

module.exports = class bfmovies extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://bfmovies.net'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const year = req.query.year;
        const resolvePromises = [];
        let headers = {};

        try {
            const searchTitle = `${title} (${year})`;
            let searchUrl = (`${url}/search?q=${searchTitle.replace(/ /g, '+')}`);
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            let videoPage = '';
            $(`li[itemtype="http://schema.org/Movie"]`).toArray().forEach(element => {
                let linkElement = $(element).find("a");

                let contentTitle = $(element).find(`*[itemprop="name"]`).text().toLowerCase();
                let contentPage = linkElement.attr('href');

                if (contentTitle === `${title} (${year})` || contentTitle === title) {
                    videoPage = contentPage;
                }
            });

            if (!videoPage) {
                return Promise.resolve();
            }

            const videoPageHTML = await this._createRequest(rp, videoPage, jar, headers);

            $ = cheerio.load(videoPageHTML);

            let openloadPage = $("iframe").attr('src');
            if(!openloadPage.includes("openload")){
                this.logger.debug("BFMovies does not always use OpenLoad.");
                return false;
            }
            const openloadHTML = await this._createRequest(rp, openloadPage);

            let openloadURL = cheerio.load(openloadHTML)('meta[name="og:url"]').attr('content');
            if (openloadURL) {
                resolvePromises.push(this.resolveLink(openloadURL, ws, jar, headers));
            } else {
                return Promise.resolve();
            }

        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
