const BaseProvider = require('../../BaseProvider');
const cheerio = require('cheerio');

module.exports = class MasterAnime extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://www.masterani.me'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title;
        const season = req.query.season;
        const episode = req.query.episode;
        const type = req.query.type;

        const resolvePromises = [];

        try {
            let searchUrl = this._generateUrl(`${url}/api/anime/search`, {
                search: title,
                sb: 'true'
            });

            const rp = this._getRequest(req, ws);
            let response = await this._createRequest(rp, searchUrl);
            let animes = JSON.parse(response);
            for (let i = 0; i < animes.length; i++) {
                let anime = animes[i];
                if (this._isTheSameSeries(anime['title'], title.replace(/\s\([0-9]{4}\)$/, ""))) {
                    let detailsResponse = await this._createRequest(rp, `${url}/api/anime/${anime['id']}/detailed`);
                    let details = JSON.parse(detailsResponse);
                    let currentEpisode;
                    if (currentEpisode = details['episodes'][episode - 1]) {
                        // Assume that the episode index is always off by 1.
                        if (currentEpisode['info']['episode'] === episode + '') {
                            let seriesHtml = await this._createRequest(rp, `${url}/anime/watch/${anime['slug']}/${currentEpisode['info']['episode']}`);
                            this._scrapeMirrors(seriesHtml, (link, quality) => {
                                resolvePromises.push(this.resolveLink(link, ws, null, null, quality));
                            });
                        }
                    }
                    break;
                }
            }
        } catch (e) {
            this._onErrorOccurred(e);
        }

        return Promise.all(resolvePromises);
    }

    /**
     * Scrape mirror links from html response.
     * @param html
     * @param {Function|null} cb
     * @return {Array}
     */
    _scrapeMirrors(html, cb) {
        let $ = cheerio.load(html);
        let mirrorsJson = $('video-mirrors').attr(':mirrors');
        let sources = [];
        if (mirrorsJson) {
            let mirrors = JSON.parse(mirrorsJson);
            for (let i = 0; i < mirrors.length; i++) {
                let mirror = mirrors[i];
                let source;
                if (mirror['host']['original']) {
                    // Full url.
                    source = mirror['embed_id'];
                } else {
                    let embedPrefix = mirror['host']['embed_prefix'] || '';
                    let embedSuffix = mirror['host']['embed_suffix'] || '';
                    source = embedPrefix + mirror['embed_id'] + embedSuffix;
                }

                cb && cb(source, mirror['quality']);
                sources.push(source);
            }
        }
        return sources;
    }

    /**
     * Return a type based on the anime id.
     * @param type
     * @return {string}
     */
    _getAnimeType(type) {
        switch (type) {
            case 4:
                return "ONA";
            case 3:
                return "Special";
            case 2:
                return "Movie";
            case 1:
                return "OVA";
            default:
                return "TV";
        }
    }

};
