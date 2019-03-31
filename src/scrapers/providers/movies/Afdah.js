const cheerio = require('cheerio');
const vm = require('vm');
const randomUseragent = require('random-useragent');
const BaseProvider = require('../BaseProvider');

module.exports = class Afdah extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://afdah.org', 'https://genvideos.com', 'https://genvideos.co', 'https://watch32hd.co', 'https://putlockerhd.co'/* , 'https://xmovies8.org' */];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const clientIp = this._getClientIp(req);
        const movieTitle = req.query.title.toLowerCase();
        const year = req.query.year;
        const resolvePromises = [];
        let headers = {};

        try {
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();

            let html = '';
            let searchUrl = '';
            try {
                searchUrl = `${url}/results?q=${movieTitle.toLowerCase().replace(/ /g, '%20').replace(/\:/g, '')}`;
                html = await this._createRequest(rp, searchUrl, jar, headers);
            } catch (err) {
                try {
                    searchUrl = `${url}/results?q=${movieTitle.toLowerCase().replace(/ /g, '+').replace(/\:/g, '')}`;
                    html = await this._createRequest(rp, searchUrl, jar, headers);
                } catch (err) {
                    searchUrl = `${url}/results?q=${movieTitle.toLowerCase().replace(/ /g, '%2B').replace(/\:/g, '')}`;
                    html = await this._createRequest(rp, searchUrl, jar, headers);
                }
            }

            let $ = cheerio.load(html);

            let videoId = '';
            $('.cell').toArray().some(element => {
                const videoName = $(element).find('.video_title').text().trim().toLowerCase();
                const videoYearAndQuality = $(element).find('.video_quality').text().trim();
                if ((videoName === `${movieTitle} (${year})` || videoName === movieTitle) && videoYearAndQuality.startsWith(`Year: ${year}`)) {
                    videoId = $(element).find('.video_title h3 a').attr('href').trim();
                    return true;
                }
                return false;
            });
            const videoPageHtml = await this._createRequest(rp, `${url}${videoId}`, jar, headers);

            const regexMatches = /(?:var frame_url = ")(.*)(?:")/g.exec(videoPageHtml);

            // TODO: I don't think all this logic should be in the provider?
            // It should be relatively simple and send the link and all the required resolver meta data.
            if (regexMatches) {
                const userAgent = randomUseragent.getRandom();

                let videoStreamUrl = `https:${regexMatches[1]}`;

                const jar = rp.jar();
                const videoPageHtml = await this._createRequest(rp, videoStreamUrl, jar, headers);

                const postID = /(?:var postID = ')(.*)(?:';)/.exec(videoPageHtml)[1];
                headers = {
                    accept: 'application/json, text/javascript, */*; q=0.01',
                    'content-length': 0,
                    'accept-language': 'en-US,en;q=0.9',
                    // 'accept-encoding': 'gzip, deflate, br',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    dnt: 1,
                    origin: 'https://vidlink.org',
                    referer: videoStreamUrl,
                    'save-data': 'on',
                    'user-agent': userAgent,
                    'x-requested-with': 'XMLHttpRequest'
                };
                const viewData = await this._createRequest(rp, 'https://vidlink.org/embed/update_views', jar, headers,
                    {
                        method: 'POST',
                        formData: {},
                        gzip: true,
                        json: true
                    }
                );
                const id_view = viewData.id_view;

                headers = {
                    accept: 'text/html, */*; q=0.01',
                    'accept-language': 'en-US,en;q=0.9',
                    // 'accept-encoding': 'gzip, deflate, br',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    dnt: 1,
                    origin: 'https://vidlink.org',
                    referer: videoStreamUrl,
                    'save-data': 'on',
                    'user-agent': userAgent,
                    'x-requested-with': 'XMLHttpRequest'
                };
                const obfuscatedSources = await this._createRequest(rp, 'https://vidlink.org/streamdrive/info', jar, headers,
                    {
                        method: 'POST',
                        formData: {
                            browserName: 'Opera',
                            platform: 'Linux x86_64',
                            postID,
                            id_view
                        }
                    }
                );

                const cleanedObfuscatedSources = obfuscatedSources.replace('return(c35?String', `return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String`);

                // try {
                // const vm = require('vm');
                // const sandbox = {window: {checkSrc: function(){}}}; // starting variables
                // vm.createContext(sandbox); // Contextify the sandbox.
                // vm.runInContext(cleanedObfuscatedSources, sandbox);

                // const link = sandbox.window.srcs[0].url;
                // const event = createEvent(link, false, {}, {quality: '', source: 'Vidlink', provider: 'Afdah'});
                // await ws.send(event, event.event);
                // } catch(err) {
                headers = {
                    accept: 'text/html, */*; q=0.01',
                    'accept-language': 'en-US,en;q=0.9',
                    // 'accept-encoding': 'gzip, deflate, br',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    dnt: 1,
                    origin: 'https://vidlink.org',
                    referer: videoStreamUrl,
                    'save-data': 'on',
                    'user-agent': userAgent,
                    'x-requested-with': 'XMLHttpRequest'
                };
                const openloadData = await this._createRequest(rp, 'https://vidlink.org/opl/info', jar, headers,
                    {
                        method: 'POST',
                        formData: {
                            postID,
                        },
                        json: true
                    }
                );

                if (openloadData) {
                    let providerUrl;

                    if (openloadData.id) {
                        providerUrl = `https://oload.cloud/embed/${openloadData.id}`;
                    } else {
                        let jwPlayerConfig;
                        let jQuery = this._getJqueryShim($);
                        const sandbox = this._getDefaultSandbox(jQuery, this._getJwPlayerShim((config) => {
                            jwPlayerConfig = config;
                        }));
                        sandbox['config'] = {};
                        let dynamicVariable = this._createNativeProxyShim('ser1', true);
                        sandbox['ser1'] = sandbox['ser2'] = sandbox['showSer1'] = sandbox['showSer2'] = dynamicVariable;

                        vm.createContext(sandbox); // Contextify the sandbox.
                        vm.runInContext(openloadData, sandbox);

                        if (jwPlayerConfig.file) {
                            providerUrl = this._absoluteUrl(videoStreamUrl, jwPlayerConfig.file);
                        }
                    }

                    if (providerUrl) {
                        resolvePromises.push(this.resolveLink(providerUrl, ws, jar, headers));
                    }
                }
            }
        }
    catch(err) {
        this._onErrorOccurred(err)
    }
        return Promise.all(resolvePromises)
    }
};