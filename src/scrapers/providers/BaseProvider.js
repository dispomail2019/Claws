const url = require('url');
const querystring = require('querystring');
const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const resolve = require('../resolvers/resolve');
const logger = require('../../utils/logger');
const javascriptEval = require('../../utils/javascriptEval');
const useragent = require('../../utils/useragent');

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
    constructor(queue) {
        this.logger = logger;
        this.userAgent = useragent.getUserAgent();
        this.queue = queue;
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
     * @param meta
     * @return {Promise<undefined|*|void>}
     */
    resolveLink(link, ws, jar, headers, quality = '', meta = {}) {
        if (process.env['CLAWS_TESTING'] === 'true' || process.env['CLAWS_DONT_RESOLVE_PROVIDERS'] === 'true') {
            // Don't attempt to resolve links.
            return link;
        }
        return resolve(ws, link, this.getProviderId(), jar, headers, quality, meta);
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
        if (this.queue.isEnabled) {
            return new Promise((resolve, reject) => {
                let job = this.queue.submit({ name: 'request', job: { request: rp(options) } });
                job.on('complete', function (result) {
                    resolve(result);
                }).on('failed', function () {
                    reject(job.data);
                });
            });
        }
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

    /**
     *
     * @param {Object} $ Cheerio object.
     * @param {Function} processFn Optional callback for modifying the default jQuery object.
     * @return {Function}
     */
    _getJqueryShim($, processFn = null) {
        return javascriptEval._getJqueryShim($, processFn);
    }

    /**
     * Return a JWPlayer shim object.
     * @param {Function} setupCallback
     */
    _getJwPlayerShim(setupCallback) {
        return javascriptEval._getJwPlayerShim(setupCallback);
    }

    _getClapprShims(playerCallback) {
        return javascriptEval._getClapprShims(playerCallback);
    }

    _getDefaultSandbox(jQuery, jwPlayer, clapper, includeBrowserShims) {
        return javascriptEval._getDefaultSandbox(jQuery, jwPlayer, clapper, includeBrowserShims);
    }

    /**
     * Create a native shim object e.g. Document, which allows you call any functions/properties and allow them
     * to resolve without throwing a "Cannot read property of undefined" error.
     * Useful for bypassing tricky resolvers like Openload which check for browser objects.
     *
     * @param {String} propertyName
     * @param {Boolean} useProxy Set this if you need to shim complex objects with dynamic properties.
     * @return {Function|Proxy}
     */
    _createNativeProxyShim(propertyName, useProxy) {
        return javascriptEval._createNativeProxyShim(propertyName, useProxy);
    }

    /**
     * Resolve jwplayer links.
     * @param {Object} setupConfig
     * @param {Object} meta
     * @return {ClawsLink[]}
     */
    _resolveJwPlayerLinks(setupConfig, meta) {
        return javascriptEval._resolveJwPlayerLinks(setupConfig, meta);
    }
};

// Done this way, because it's the only way to get IntelliJ type-hinting to work.
module.exports = BaseProvider;