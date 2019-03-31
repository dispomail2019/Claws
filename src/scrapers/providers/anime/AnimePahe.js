const BaseProvider = require('../BaseProvider');

module.exports = class AnimePahe extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://animepahe.com'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title;
        const season = req.query.season;
        const episode = parseInt(req.query.episode);

        const resolvePromises = [];

        try {
            let searchUrl = this._generateUrl(`${url}/api`, {
                m: 'search',
                l: 8,
                'q': title,
            });

            const rp = this._getRequest(req, ws);
            let response = await this._createRequest(rp, searchUrl);
            let data = JSON.parse(response);
            let animes = data.data;
            for (let i = 0; i < animes.length; i++) {
                // Assume the search result is smart enough such that the top results which may contain the anime episode
                // is always what we want. e.g. searching for a romanized name can return a result with a japanese name.
                let anime = animes[i];
                if (anime.episodes >= episode) {
                    // Contains the episode we're looking for.
                    const perPage = 30;
                    let page = Math.floor(episode / perPage) + 1;
                    let episodeListUrl = this._generateUrl(`${url}/api`, {
                        'm': 'release',
                        'id': anime.id,
                        'l': perPage,
                        'sort': 'episode_asc',
                        'page': page,
                    });
                    let episodesResponse = await this._createRequest(rp, episodeListUrl);
                    let episodes = JSON.parse(episodesResponse);
                    if (episodes.from >= episode && episode <= episodes.to) {
                        // Episode exists.
                        let _episodes = episodes.data;
                        for (let _i = 0; _i < _episodes.length; _i++) {
                            let _episode = _episodes[_i];
                            if (parseInt(_episode.episode) === episode) {
                                // Do we really need to resolve all the alternative resolvers?
                                let resolvers = [
                                    'kwik',
                                    'openload',
                                    'streamango',
                                ];
                                for (let resolver of resolvers) {
                                    let episodeLinksUrl = this._generateUrl(`${url}/api`, {
                                        'm': 'embed',
                                        'id': _episode.id,
                                        'p': resolver,
                                    });

                                    let episodeLinks = await this._createRequest(rp, episodeLinksUrl);
                                    let response = JSON.parse(episodeLinks);
                                    if (response && response['data'] && response['data']) {
                                        for (const [episodeId, qualities] of Object.entries(response['data'])) {
                                            for (const [quality, data] of Object.entries(qualities)) {
                                                resolvePromises.push(this.resolveLink(data.url, ws, null, null, quality, {
                                                    filesize: data.filesize, // The file size.
                                                    fansub: data.fansub,
                                                    disc: data.disc,
                                                }));
                                            }
                                        }
                                    }
                                }
                            }
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
};