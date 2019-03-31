const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');
const logger = require('../../../utils/logger')

const resolve = require('../../resolvers/resolve');

async function _5movies(req, ws){
    logger.debug("5movies NOTICE: This primitively removes the year from the end of the title. If this source breaks, did you change the title parameter?");
    let showTitle = req.query.title || req.query.name;
    showTitle = showTitle.substr(0, showTitle.length - 7);

    const season = req.query.season;
    const episode = req.query.episode;

    const urls = ["http://5movies.fm"];
    const promises = [];

    const rp = RequestPromise.defaults(target => {
        if (ws.stopExecution) {
            return null;
        }

        return RequestPromise(target);
    });

    async function scrape(url){
        // Fetch the HTML from the page
        let html = await rp({
            uri: `${url}/search-movies/${showTitle.replace(/ /g, '+')}.html`,
            timeout: 5000
        });

        logger.debug(`${url}/search-movies/${showTitle.replace(/ /g, '+')}.html`);

        let videoPage = '';

        // Find the link to the content
        let $ = cheerio.load(html);

        $(".movies-list.movies-list-full").each((index, element) => {
            let linkElement = $(element).find(".ml-item a");

            let contentTitle = linkElement.find('.mli-info h2').text();
            let contentPage = linkElement.attr('href');

            if(contentTitle === `${showTitle}: Season ${season}`) videoPage = contentPage;
        });

        logger.debug("debug: " + videoPage);


        let videoPageHTML = await rp({
            uri: videoPage,
            timeout: 5000
        });

        $ = cheerio.load(videoPageHTML);
        let scriptCode = $(`#media-player script`).html();
        logger.debug(scriptCode.split(`document.write(Base64.decode("`));
        let enterVideoURL = Buffer.from(scriptCode
            .split(`document.write(Base64.decode("`)[1]
            .split(`"));`)[0], 'base64').toString('utf8');

        $ = cheerio.load(enterVideoURL);
        enterVideoURL = $('iframe').attr('src');

        /*// targetPageHTML is the HTML for the player page.
        let targetPageHTML = await rp({
            uri: pageURL,
            timeout: 5000,
            headers: {
                'Referer': videoPage
            }
        });

        let outputPageURL = cheerio.load(targetPageHTML)('iframe').attr('src');

        let outputPageHTML = await rp({
            uri: outputPageURL,
            timeout: 5000,
            headers: {
                'Referer': videoPage
            }
        });

        // This is the provider URL
        let rapidVideoURL = cheerio.load(outputPageHTML)('link[rel="canonical"]').attr('href');
        console.log(rapidVideoURL);

        const jar = rp.jar();
        return Promise.all([resolve(ws, rapidVideoURL, '123Movie', jar, {})]);*/
        const jar = rp.jar();
        return Promise.all([resolve(ws, enterVideoURL, '5movies', jar, {})]);
    }

    urls.forEach((url) => {
        promises.push(scrape(url));
    });

    return Promise.all(promises);

}

module.exports = exports = _5movies;