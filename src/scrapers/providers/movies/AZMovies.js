const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const BaseProvider = require('../BaseProvider');
const tough = require('tough-cookie');

module.exports = class AZMovies extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ["https://azmovie.to"];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const clientIp = this._getClientIp(req);
        const movieTitle = req.query.title;
        const year = req.query.year;
        const resolvePromises = [];

        try {
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const searchMovieUrl = `${url}/livesearch.php`;
            const referer = `https://azmovie.to/`;
            const userAgent = randomUseragent.getRandom();
            const headers = {
                referer,
                'user-agent': userAgent,
                'x-real-ip': clientIp,
                'x-forwarded-for': clientIp
            };

            let searchResults = await this._createRequest(rp, searchMovieUrl, jar, headers, {
                method: 'POST',
                formData: {
                    searchVal: movieTitle,
                },
                followAllRedirects: true,
            })

            let $ = cheerio.load(searchResults);

            let movieUrl = '';
            $('a').toArray().some(searchResultElement => {
                for (let childNode of searchResultElement.childNodes) {
                    if (childNode.data === `${movieTitle} (${year})` || childNode.data === movieTitle) {
                        movieUrl = `${url}/${$(searchResultElement).attr('href')}`;
                        return true;
                    }
                }

                return false;
            });
            if (!movieUrl) {
                return Promise.resolve();
            }

            let html = await this._createRequest(rp, movieUrl, jar, headers)

            let documentCookie = /document\.cookie\s*=\s*"(.*)=(.*)";/g.exec(html);
            while (documentCookie) {
                // TODO this needs work, response variable is undefined.
                const cookie = new tough.Cookie({
                    key: documentCookie[1],
                    value: documentCookie[2]
                });
                jar.setCookie(cookie, url);
                response = response.replace('document.cookie', '');
                documentCookie = /document\.cookie\s*=\s*"(.*)=(.*)";/g.exec(response);
            }

            const videoPageHtml = await this._createRequest(rp, movieUrl, jar, headers);

            $ = cheerio.load(videoPageHtml);

            $('#serverul li a').toArray().forEach((element) => {
                const providerUrl = this._absoluteUrl(movieUrl, $(element).attr('href'));
                resolvePromises.push(this.resolveLink(providerUrl, ws, jar, headers));
            });
        }
        catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}