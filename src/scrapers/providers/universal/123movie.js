const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const BaseProvider = require('../BaseProvider');

module.exports = class _123movie extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ["https://www6.123movie.cc"];
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
        const headers = {
            'referer': url
        };

        try {
            let searchTitle = `${title}`;
            if (type == 'tv') {
                searchTitle = `${searchTitle}: season ${season}`;
            }
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const searchUrl = `${url}/search/?s=${searchTitle.replace(/ /g, '+')}`;
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            let videoPage = '';
            $("article.item").toArray().some(element => {
                let linkElement = $(element).find(".titlecover");
                let contentPage = linkElement.attr('href');

                if (linkElement.text().toLowerCase() == searchTitle) {
                    videoPage = contentPage;
                }
            });
            if (!videoPage) {
                return Promise.resolve();
            }

            let videoPageHTML = await this._createRequest(rp, videoPage, jar, headers);

            $ = cheerio.load(videoPageHTML);

            // Only Grabs Openload Currently
            let pageURL = '';
            if (type === 'tv'){
                $(`.paginated-openload .episodios .mark .liopv`).each((index, element) => {
                    if($(element).text() === episode.toString()) {
                        pageURL = $(element).attr('onclick').split("'")[1];
                    }
                });
            } else {
                pageURL = $(`.liopv[onclick*="openload"]`).attr('onclick').split("'")[1];
            }
            if (!pageURL) {
                return Promise.resolve();
            }

            let targetPageHTML = await this._createRequest(rp, pageURL, jar, headers);
            let outputPageURL = cheerio.load(targetPageHTML)('iframe').attr('src');
            let outputPageHTML = await this._createRequest(rp, outputPageURL, jar, headers);
            let openloadVideoURL = cheerio.load(outputPageHTML)('meta[name="og:url"]').attr('content');
            resolvePromises.push(this.resolveLink(openloadVideoURL, ws, jar, headers));
        }
        catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}