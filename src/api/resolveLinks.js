'use strict';

// Load providers
const providers = require('../scrapers/providers');
const logger = require('../utils/logger');
const db = require('../db/db');
const Cache = require('../db/models/cache');
const BaseProvider = require('../scrapers/providers/BaseProvider');

/**
 * Sends the current time in milliseconds.
 */
const sendInitialStatus = (sse) => sse.send({ data: [`${new Date().getTime()}`], event: 'status'}, 'result');

/**
 * Return request handler for certain media types.
 * @param data media query
 * @param ws web socket
 * @param req request
 * @return {Function}
 */
const resolveLinks = async (searchData, ws, req) => {
    const type = searchData.type;
    const sse = {
        send: (resultData) => {
            saveToCache(req, resultData);
            try {
                ws.send(JSON.stringify(resultData));
            } catch (err) {
                console.log("WS client disconnected, can't send data");
            }
        },
        stopExecution: false
    };
 
    sendInitialStatus(sse);

    ws.on('close', () => {
        sse.stopExecution = true;
    });

    const promises = [];

    req.query = searchData;

    // Get available providers.
    let availableProviders = [...providers[type], ...providers.universal];

    // Add anime providers if Anime tag sent from client. 
    // TODO: Add and send this tag from the client
    if (type === 'anime') {
        availableProviders.push([...providers.anime]);
    }

    availableProviders.forEach((provider) => {
            return promises.push(provider.resolveRequests(req, sse));
    });

    await Promise.all(promises);

    sse.send({event: 'done'}, 'done');
};

const saveToCache = async(req, data) => {
    if (data) {
        let link;
        if (data.event === 'scrape'){
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
