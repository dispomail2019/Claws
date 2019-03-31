const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const logger = require('../../../utils/logger')

const {escapeRegExp} = require('../../../utils');
const resolve = require('../../resolvers/resolve');

async function MovieFiles(req, ws) {
    const clientIp = req.client.remoteAddress.replace('::ffff:', '').replace('::1', '');
    const movieTitle = req.query.title;
    const year = req.query.year;

    // These are all the same host I think. https://xmovies8.org isn't loading.
    const urls = ["https://moviefiles.org"];
    const promises = [];

    const rp = RequestPromise.defaults(target => {
        if (ws.stopExecution) {
            return null;
        }

        return RequestPromise(target);
    });

    // Go to each url and scrape for links, then send the link to the client
    async function scrape(url) {
        const resolvePromises = [];

        try {
            const jar = rp.jar();
            const modifiedSearchTitle = movieTitle.replace(/[\(\)]/, '').replace(/[\s:]/g, '.');
            const movieSearchUrl = `${url}/?search=${modifiedSearchTitle}`;
            const userAgent = randomUseragent.getRandom();
            const headers = {
                'user-agent': userAgent,
            };

            const searchPageHtml = await rp({
                uri: movieSearchUrl,
                headers,
                jar,
                followAllRedirects: true,
                timeout: 5000
            });

            let $ = cheerio.load(searchPageHtml);

            $(`a:contains("${modifiedSearchTitle}")`).toArray().forEach(element => {
                const isTitleExp = new RegExp(`${escapeRegExp(modifiedSearchTitle)}\\.${year}`);
                const foundTitle = $(element).text();
                if (isTitleExp.test(foundTitle)) {
                    const providerUrl = `${url}/${$(element).attr('href')}`;
                    const qualityExp = new RegExp(`${escapeRegExp(modifiedSearchTitle)}\\.${year}\\.[^\\d]*(\\d\\d\\d\\d?p)`);
                    const qualityExec = qualityExp.exec(foundTitle);
                    const quality = qualityExec ? qualityExec[1] : '';
                    resolvePromises.push(resolve(ws, providerUrl, 'MovieFiles', jar, headers, quality));
                }
            });
        } catch (err) {
            if (!ws.stopExecution) {
                logger.error({provider: 'MovieFiles', providerUrl: url, query: {title: req.query.title}, error: (err.message || err.toString()).substring(0, 100) + '...'});
            }
        }

        return Promise.all(resolvePromises);
    }

    // Asynchronously start all the scrapers for each url
    urls.forEach((url) => {
        promises.push(scrape(url));
    });

    return Promise.all(promises);
}

module.exports = exports = MovieFiles;