const url = require('url');
const querystring = require('querystring');
const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const resolve = require('../resolvers/resolve');
const logger = require('../../utils/logger');
const randomUseragent = require('random-useragent');

function _implementMe(functionName) {
    throw new Error(`Must implement ${functionName}()`);
}

/**
 * Base class containing custom logic used by the majority of the providers.
 * Functions to implement in subclass:
 * - getUrls
 * - scrape
 */
const BaseProvider = class BaseProvider {
    constructor() {
        this.logger = logger;
        this.userAgent = randomUseragent.getRandom();
        
        if (new.target === BaseProvider) {
            throw new TypeError("Cannot construct BaseProvider instances directly");
        }
    }

    /**
     * Return the provider id, this is usually the name of the class.
     * @return String
     */
    getProviderId() {
        return this.constructor.name;
    }

    /**
     * Return a list of URL aliases which share a common request method.
     * @return {Array}
     */
    getUrls() {
        _implementMe('getUrls');
    }

    /**
     * Scrape the URL
     * @param url
     * @param req
     * @param ws
     *
     * @return Promise Usually.
     */
    scrape(url, req, ws) {
        _implementMe('scrape');
    }

    /**
     * Resolve links.
     * Should be called by the `scrape` function when it finds a link that needs resolving.
     *
     * @param link
     * @param ws
     * @param jar
     * @param headers
     * @param quality
     * @return {Promise<undefined|*|void>}
     */
    resolveLink(link, ws, jar, headers, quality = '') {
        return resolve(ws, link, this.getProviderId(), jar, headers, quality);
    }

    /**
     * Resolve requests.
     * @param req
     * @param ws
     * @return {Array}
     */
    resolveRequests(req, ws) {
        // Set instance variables that depend on `req` or `ws`
        this._setInstanceVariables(req, ws);
        
        // Asynchronously start all the scrapers for each url
        const promises = [];
        this.getUrls().forEach((url) => {
                promises.push(this.scrape(url, req, ws));
        });

        return Promise.all(promises);
    }

/**
 * Set variables on each Provider to be re-used throughout the providers logic
 * @param req
 * @param ws
 * @returns void
 */
_setInstanceVariables(req, ws) {
    this.clientIp = this._getClientIp(req);
    this.remoteAddress = req.client.remoteAddress;
    this.rp = this._getRequest(req, ws);
    this.searchInformation = { ...req.query }
}

/**
 * Return the client IP to use for proxy requests.
 * @param req
 * @return {string}
 */
_getClientIp(req) {
    return req.client.remoteAddress.replace('::ffff:', '').replace('::1', '');
}

/**
 * Return the default request promise object to use for all requests.
 *
 * @param req
 * @param ws
 * @return Function
 */
_getRequest(req, ws) {
    return RequestPromise.defaults(target => {
        if (ws.stopExecution) {
            return null;
        }

        return RequestPromise(target);
    })
}

/**
 * Function for creating a new request.
 * @param {Function} rp The request promise returned by `_getRequest`
 * @param {String} uri
 * @param {Object|null} jar
 * @param {Object|null} headers
 *
 * @param {Object|null} extraOptions
 * @return Promise
 */
_createRequest(rp, uri, jar = null, headers = null, extraOptions = {}) {
    if (typeof jar === 'undefined' && rp.jar) {
        jar = rp.jar();
    }
    let options = {
        uri,
        headers,
        jar,
        followAllRedirects: true,
        timeout: 5000,
        ...extraOptions,
    };

    return rp(options);
}

/**
 * Whether the remote name matches the requested one.
 *
 * @param remoteName
 * @param searchTitle
 * @return {boolean}
 */
_isTheSameSeries(remoteName, searchTitle) {
    return remoteName.toLowerCase() === searchTitle.toLowerCase();
}

/**
 * Resolve a URl from a base URL
 * @param baseUrl
 * @param path
 * @return {string}
 */
_absoluteUrl(baseUrl, path) {
    return url.resolve(baseUrl, path);
}

/**
 * Generate a URL that properly escapes/encodes query strings.
 * Avoiding cases where the query string itself contains an "&".
 *
 * @param {String} url
 * @param {Object} queryStringObject
 * @param {String} glue
 * @return {string}
 */
_generateUrl(url, queryStringObject, glue = '?') {
    return url + glue + querystring.stringify(queryStringObject);
}

_onErrorOccurred(e) {
    if (e.name === 'StatusCodeError') {
        e = {
            name: e.name,
            statusCode: e.statusCode,
            options: e.options,
        }
    }
    this.logger.error(`${this.getProviderId()}: An unexpected error occurred:`, e);
}
};

// Done this way, because it's the only way to get IntelliJ type-hinting to work.
module.exports = BaseProvider;