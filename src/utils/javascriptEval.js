/**
 * Helper util for javascript evaluations.
 */

/**
 *
 * @param {Object} $ Cheerio object.
 * @param {Function} processFn Optional callback for modifying the default jQuery object.
 * @return {Function}
 */
function _getJqueryShim($, processFn = null) {
    return function (selector, anotherArg) {

        let jQuery = function () {
            return jQuery;
        };

        jQuery.ready = jQuery.click = jQuery.hide = jQuery.show = jQuery.mouseup = jQuery.mousedown =
            jQuery.hasClass = jQuery.attr = jQuery.post = jQuery.get = jQuery.append = jQuery;

        jQuery.cookie = function () {
            return true;
        };

        if (processFn) {
            // Allow sub-classes to modify the returned jQuery object.
            processFn(jQuery, $, arguments);
        }

        return jQuery
    };
}

/**
 * Return a JWPlayer shim object.
 * @param {Function} setupCallback
 */
function _getJwPlayerShim(setupCallback) {
    let jwplayer = function () {
        return jwplayer;
    };
    jwplayer.on = jwplayer.addButton = jwplayer.onTime = jwplayer.onComplete = jwplayer;

    jwplayer.setup = (config) => {
        let response = setupCallback(config);
        if (response) {
            return response;
        }
        return jwplayer;
    };

    return jwplayer;
}

function _getClapprShims(playerCallback) {
    let noop = function () {
        return noop;
    };
    let player = function (config) {
        playerCallback && playerCallback(config, 'constructor');
        return {
            options: config,
            attachTo: noop,
            listenTo: noop,
            configure: noop,
            play: noop,
            load: (options) => {
                playerCallback && playerCallback(options, 'load');
            },
        }
    };
    let events = function () {
        return {
            PLAYER_FULLSCREEN: 'fullscreen',
            on: events,
            once: events,
            off: events,
            trigger: events,
            stopListening: events,
        }
    };
    let Clappr = {
        Player: player,
        Events: events,
    };
    Clappr.$ = function () {
        return {text: noop};
    };

    // List of properties which should be merged into the context object.
    return {
        Clappr: Clappr,
        LevelSelector: {},
        TheaterMode: {},
    };
}

function _getDefaultSandbox(jQuery, jwPlayer, clapper, includeBrowserShims) {
    // Ideally the sandbox would be a proxy object, but that's not allowed.
    let sandbox = {
        $: jQuery,
        jQuery: jQuery,
        jwplayer: jwPlayer,
        sin: Math.sin,
        navigator: {
            userAgent: ''
        },
        atob: function (encodedData) {
            return Buffer.from(encodedData, 'base64').toString();
        },
        btoa: function (stringToEncode) {
            return Buffer.from(stringToEncode).toString('base64');
        },
        ...clapper,
    };

    if (includeBrowserShims) {
        let Document = _createNativeProxyShim('Document', false);

        sandbox['Document'] = Document;
        sandbox['document'] = Document;
    }

    sandbox['window'] = sandbox;
    return sandbox;
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
function _createNativeProxyShim(propertyName, useProxy) {
    let shim;
    if (useProxy) {
        shim = new Proxy(function () {
            return shim;
        }, {
            get: function (target, name, proxy) {
                if (target.hasOwnProperty(name)) {
                    return target[name];
                }

                if ('hasOwnProperty' === name) {
                    return function () {
                        return true;
                    }
                } else if ('toString' === name) {
                    return `toString: ${name}`;
                } else if ('length' === name) {
                    return 0;
                } else if (name === '__proto__') {
                    return proxy ? proxy : shim;
                }

                return _createNativeProxyShim(name, true);
            },
        });
    } else {
        shim = function () {
        };
    }

    let objectToString = "[object " + (propertyName.charAt(0).toUpperCase() + propertyName.slice(1)) + "]";

    shim.toString = function () {
        if (useProxy || /^[A-Z]/.test(propertyName)) {
            // Starts with a uppercase - it's a class.
            return "function " + propertyName + "() { [native code] }";
        }
        return objectToString;
    };
    shim.__proto__.toString = shim.toString;
    shim.prototype.toString = function () {
        return objectToString
    };

    return shim;
}

/**
 * Resolve jwplayer links.
 * @param {Object} setupConfig
 * @param {Object} meta
 * @return {ClawsLink[]}
 */
function _resolveJwPlayerLinks(setupConfig, meta) {
    let links = [];
    if (setupConfig && setupConfig.file) {
        links.push({
            data: setupConfig.file,
            meta,
        });
    }
    if (setupConfig.sources) {
        setupConfig.sources.forEach(function (source) {
            links.push({
                data: source.file,
                meta: {
                    ...meta,
                    quality: source.label,
                },
            });
        });
    }

    return links;
}

module.exports = {
    _getJqueryShim,
    _getJwPlayerShim,
    _getClapprShims,
    _getDefaultSandbox,
    _createNativeProxyShim,
    _resolveJwPlayerLinks,
};