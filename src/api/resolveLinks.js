'use strict';

// Load providers
const { providers } = require('../scrapers/providers');
const { queue } = require('../utils/queue');
const RequestPromise = require('request-promise');

const logger = require('../utils/logger');
const WsWrapper = require('../utils/WsWrapper');

/**
 * Sends the current time in milliseconds.
 */
const sendInitialStatus = (ws) => ws.send(JSON.stringify({ data: [`${new Date().getTime()}`], event: 'status' }));

/**
 * Return request handler for certain media types.
 * @param data media query
 * @param ws web socket
 * @param req request
 * @return {Function}
 */
const resolveLinks = async (data, ws, req) => {
    const type = data.type;

    sendInitialStatus(ws);

    const wsWrapper = new WsWrapper(ws, data.options);

    ws.on('close', () => {
        wsWrapper.stopExecution = true;
    });

    const promises = [];

    req.query = data;

    // Get available providers.
    let availableProviders = [...providers[type], ...providers.universal];

    availableProviders.forEach((provider) => promises.push(provider.resolveRequests(req, wsWrapper)));

    if (queue.isEnabled) {
        queue.process()
    }

    await Promise.all(promises);
    if (ws.isAlive) {
        logger.debug('Scraping complete: sending `Done` event');
        ws.send(JSON.stringify({ event: 'done' }));
    } else {
        logger.debug('Scraping complete: `Done` event ready, but websocket is dead.');
    }
}

const saveToCache = async (req, data) => {
    if (data) {
        let link;
        if (data.event === 'scrape') {
            link = {
                uri: data.target,
                type: req.query.type,
                metadata: {
                    title: req.query.title,
                    year: req.query.year,
                    episode: req.query.episode,
                    season: req.query.season,
                    provider: data.source,
                }
            }
        } else {
            link = {
                uri: data.file.data,
                type: req.query.type,
                metadata: {
                    title: req.query.title,
                    year: req.query.year,
                    episode: req.query.episode,
                    season: req.query.season,
                    provider: data.metadata.provider,
                    headers: data.headers,
                }
            }
        }
        const linkExists = Cache.findOne({
            uri: data.link
        })
            .then(linkExists => {
                return linkExists || Cache.create(link)
            });
    }
}

module.exports = resolveLinks;
