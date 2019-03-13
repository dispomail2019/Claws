const mongoose = require('mongoose');
const CacheSchema = require('../../../db/models/cache');
const BaseProvider = require('../BaseProvider');

module.exports = class Cache extends BaseProvider {
    getUrls() {
        return ['cache']
    }
    async scrape(url, req, ws) {
        const title = req.query.title;
        const { season, episode, year, type } = req.query;
        const resolvePromises = [];
        const headers = {
            'user-agent': this.userAgent,
            'x-real-ip': req.client.remoteAddress,
            'x-forwarded-for': req.client.remoteAddress
        };
        let searchMetadata = {
            'metadata.title': title,
            'metadata.year': year,
        }

        if (type === 'tv') {
            searchMetadata['metadata.episode'] = episode;
            searchMetadata['metadata.season'] = season;
        }
        const results = await CacheSchema.find({ ...searchMetadata })
        results.forEach((link) => {
            resolvePromises.push(this.resolveLink(link.uri, ws, this.rp.jar(), headers));
        })
        return Promise.all(resolvePromises)
    }
}