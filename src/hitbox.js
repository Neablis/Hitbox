/**
 * @fileOverview
 * @author Mitchell DeMarco
 * @version 0.1
 */

/**
 * Hitbox API
 * A module representing the voxer business server calls.
 * @name Hitbox
 * @return Hitbox
 * @version 1.0
 * @class Hitbox
 */

/* jshint strict: true */
;(function ( name, definition ) {
    var theModule = definition(),
        hasDefine = typeof define === 'function',
        hasExports = typeof module !== 'undefined' && module.exports;

    if ( hasDefine ) { // AMD Module
        define(theModule);
    } else if ( hasExports ) { // Node.js Module
        module.exports = theModule;
    } else { // Assign to common namespaces or simply the global object (window)


        // account for for flat-file/global module extensions
        var obj = definition();
        var namespaces = name.split(".");
        var scope = (this.jQuery || this.ender || this.$ || this);
        for (var i = 0; i < namespaces.length; i++) {
            var packageName = namespaces[i];
            if (obj && i == namespaces.length - 1) {
                obj[packageName] = theModule;
            } else if (typeof scope[packageName] === "undefined") {
                scope[packageName] = {};
            }
            scope[packageName] = obj;
        }

    }
})('Hitbox', function () {
    "use strict";
    /** Properties of the module. */
    var home_router = '',
        chat_socket = null,
        listeners = [],
        timeout = 15000;

    /** @constructor */
    var Hitbox = function (config) {
        if (config !== undefined) {
            this.home_router = config.home_router || 'http://api.hitbox.tv';
        } else {
            this.home_router = 'http://api.hitbox.tv';
        }
    };

    /**
     * Set the router to use.
     * @name Hitbox#set
     * @function
     * @public
     * @param {object} home_router - object key/val to set
     * @example
     * Hitbox.set({home_router: 'http://api.hitbox.tv/'});
     */
    Hitbox.prototype.set = function (object) {
        for (var key in object) {
            this[key] = object[key];
        }
        return this;
    };

    /**
     * Parses a server response
     * @name Web_Business#_parse_response
     * @private
     * @function
     * @param {string} response - data for the post_body
     * @param {function} callback - callback callback
     * @returns {Object} xhr - xDomainObject
     * @example
     *
     */
    Hitbox.prototype._parse_response = function (response, callback) {
        var data_obj;
        var header;
        try {
            header = response.status;
            data_obj = response;
        } catch (e) {
            return callback(null, response);
        }
        if (header >= 300) {
            return callback(header, data_obj.response);
        }
        return callback(null, data_obj.response);
    };

    /**
     * Send a post request to the server
     * @name Hitbox#_post_message
     * @private
     * @function
     * @param {object} data - data for the post_body
     * @param {object} options - options for the ajax call and the url to call.
     * @param {function} callback - callback callback
     * @returns {Object} xhr - xDomainObject
     * @example
     */
    Hitbox.prototype._post_message = function (data, options, callback) {
        callback = callback || function () {};
        options = options || {};
        var url,
            post_data = {},
            post_body,
            xhReq,
            that = this;

        url = options.url;

        // add the parameters specific to that message
        for (var key in data) {
            var obj = data[key];
            post_data[key] = obj;
        }

        // create the URL
        if (options.home_router) {
            url = this._create_url({uri: url, query_params: options.query}, {
                home_router: options.home_router
            });
        } else {
            return callback('Home router required');
        }

        post_body = JSON.stringify(post_data) + "\r\n";

        if (this._is_server()) {
            var url_parse, path, host;
            if (this.url_parser === undefined) {
                this.url_parser = require('url');
            }

            if (this.https === undefined) {
                this.https = require('https');
            }

            if (this.request === undefined) {
                this.request = require('request');
            }


            url_parse = this.url_parser.parse(url);
            path = url_parse.path;
            host = url_parse.host;

            this.request.post({
                url:     url,
                body:    post_body
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    that._parse_response(body, callback);
                } else {
                    callback(response.statusCode, body);
                }
            });
        } else {
            if ('withCredentials' in new XMLHttpRequest()) {
                xhReq = new XMLHttpRequest();
            } else {
                xhReq = new XDomainRequest();
            }

            xhReq.open("POST", url);
            xhReq.timeout = this.timeout;

            xhReq.onload = function () {
                var data_obj;
                if (options.raw) {
                    callback(null, xhReq);
                } else {
                    that._parse_response(xhReq, callback);
                }
            };

            xhReq.onerror = function (e) {
                try {
                    console.log("error in _post_message " + JSON.parse(xhReq.responseText));
                } catch (error) {
                    console.log('Unknown error in _post_message: ' + error);
                }
                callback(xhReq);
            };

            xhReq.onprogress = function (e) {

            };

            xhReq.ontimeout = function (e) {
                try {
                    console.log("error in _post_message " + JSON.parse(xhReq.responseText));
                } catch (error) {
                    console.log('Unknown error in _post_message: ' + error);
                }
                callback(xhReq);
            };

            if ('withCredentials' in new XMLHttpRequest()) {
                xhReq.setRequestHeader('Content-Type','text/plain');
            }

            xhReq.send(post_body);

            return xhReq;
        }


    };

    /**
     * Send a get request to the server
     * @name Hitbox#_get_message
     * @private
     * @function
     * @param {object} data - data to append to end of url
     * @param {object} options - options for the ajax call
     *  @param {string} url - the server endpoint to call
     * @param {function} error - error callback
     * @param {function} callback - callback callback
     * @returns {Object} xhr - xDomainObject
     * @example
     */
    Hitbox.prototype._get_message = function (data, options, callback) {
        options = options || {};
        callback = callback || function () {};

        var url = options.url,
            post_body, xhReq, that = this;

        if (options.home_router) {
            url = this._create_url({uri: url, query_params: data}, {
                home_router: options.home_router
            });
        } else {
            return callback('Home router required');
        }

        if (this._is_server()) {
            var url_parse, path, host;
            if (this.url_parser === undefined) {
                this.url_parser = require('url');
            }

            if (this.https === undefined) {
                this.https = require('https');
            }

            if (this.request === undefined) {
                this.request = require('request');
            }


            this.request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    that._parse_response(body, callback);
                } else {
                    callback(response.statusCode, body);
                }

            });
        } else {
            if ('withCredentials' in new XMLHttpRequest()) {
                xhReq = new XMLHttpRequest();
            } else {
                xhReq = new XDomainRequest();
            }

            xhReq.open("GET", url);

            xhReq.timeout = this.timeout;
            xhReq.onload = function () {
                var data_obj;
                if (options.raw) {
                    callback(null, xhReq);
                } else {
                    that._parse_response(xhReq, callback);
                }
            };

            xhReq.onerror = function (e) {
                try {
                    console.log("error in _post_message " + JSON.parse(xhReq.responseText));
                } catch (error) {
                    console.log('Unknown error in _post_message: ' + error);
                }
                callback(xhReq);
            };

            xhReq.onprogress = function (e) {

            };

            xhReq.ontimeout = function (e) {
                try {
                    console.log("error in _post_message " + JSON.parse(xhReq.responseText));
                } catch (error) {
                    console.log('Unknown error in _post_message: ' + error);
                }
                callback(xhReq);
            };

            xhReq.send(null);

            return xhReq;
        }
    };

    /**
     * Create a url from parameters
     * @name Hitbox#_create_url
     * @function
     * @private
     * @returns {string} returns a string with the full url
     */
    Hitbox.prototype._create_url = function (params, options) {
        var query_params = params.query_params || {};
        options = options  || {};
        options.home_router = options.home_router || this.home_router;


        var url = '';

        if (!options.home_router) {

        } else {
            if (params.uri.indexOf('://') === -1) {
                if (query_params.length !== undefined) {
                    url = options.home_router + "/" + params.uri + '?';
                } else {
                    url = options.home_router + "/" + params.uri;
                }
            }
            else {
                if (query_params.length !== undefined) {
                    url = params.uri + '?';
                } else {
                    url = params.uri;
                }
            }
        }

        for (var arg in query_params) {
            if (query_params[arg]) {
                if (url[url.length-1] === '?') {
                    url += arg + "=" + encodeURIComponent(query_params[arg].toString());
                } else {
                    url += "&" + arg + "=" + encodeURIComponent(query_params[arg].toString());
                }
            }
        }
        return url;
    };

    /**
     * Check if javascript is being run on server or client
     * @name Hitbox#_is_server
     * @function
     * @private
     * @returns {bool} returns true is code is running on server
     */
    Hitbox.prototype._is_server = function () {
        return ! (typeof window != 'undefined' && window.document);
    };

    /**
     * Return a livestream media object.
     * @name Hitbox#media
     * @public
     * @function
     * @param {object} data - data to append to end of url
     *   @param {string} stream - A specific media stream to return
     * @param {object} options - options for the ajax call
     * @param {function} callback - callback callback
     * @returns {Object} xhr - xDomainObject
     * @example
     */
    Hitbox.prototype.media = function (params, options, callback) {
        options = options || {};
        var router = options.router || this.home_router,
            data = {},
            url = 'media/';

        if (params !== undefined && params.stream) {
            url += params.stream;
        }

        return this._get_message(data, {home_router: router, url: url}, callback);
    };

    /**
     * Returns user object.
     * @name Hitbox#user
     * @public
     * @function
     * @param {object} data - data to append to end of url
     *  @param {string} user - the server endpoint to call
     * @param {object} options - options for the ajax call
     * @param {function} callback - callback callback
     * @returns {Object} xhr - xDomainObject
     * @example
     */
    Hitbox.prototype.user = function (params, options, callback) {
        options = options || {};
        var router = options.router || this.home_router,
            data = {},
            url = 'user/';

        if (params.user === undefined) {
            return callback('User Required');
        }

        url += params.user;

        return this._get_message(data, {home_router: router, url: url}, callback);
    };

    /**
     * Returns follower object for user.
     * @name Hitbox#followers
     * @public
     * @function
     * @param {object} data - data to append to end of url
     *  @param {string} user - the server endpoint to call
     *  @param {int} offset - Offset to return followers of, default 0
     *  @param {int} limit - Limit of users to return, default 100
     * @param {object} options - options for the ajax call
     * @param {function} callback - callback callback
     * @returns {Object} xhr - xDomainObject
     * @example
     */
    Hitbox.prototype.followers = function (params, options, callback) {
        options = options || {};
        var router = options.router || this.home_router,
            data = {},
            url = 'followers/user/';

        if (params.user === undefined) {
            return callback('User Required');
        }

        url += params.user;

        if (params.offset !== undefined) {
            data.offset = params.offset;
        }

        if (params.limit !== undefined) {
            data.limit = params.limit;
        }

        return this._get_message(data, {home_router: router, url: url}, callback);
    };

    /**
     * Returns a list of games objects sorted by number of current viewers on hitbox, most popular first.
     * @name Hitbox#games
     * @public
     * @function
     * @param {object} data - data to append to end of url
     * @param {object} options - options for the ajax call
     * @param {function} callback - callback callback
     * @returns {Object} xhr - xDomainObject
     * @example
     */
    Hitbox.prototype.games = function (params, options, callback) {
        options = options || {};
        var router = options.router || this.home_router,
            data = {},
            url = 'games/';

        return this._get_message(data, {home_router: router, url: url}, callback);
    };

    /**
     * Returns a list of active teams.
     * @name Hitbox#games
     * @public
     * @function
     * @param {object} data - data to append to end of url
     *   @param {string} team - specific team to lookup
     * @param {object} options - options for the ajax call
     * @param {function} callback - callback callback
     * @returns {Object} xhr - xDomainObject
     * @example
     */
    Hitbox.prototype.games = function (params, options, callback) {
        options = options || {};
        var router = options.router || this.home_router,
            data = {},
            url = 'teams/';

        if (params.team !== undefined) {
            url += params.team;
        }

        return this._get_message(data, {home_router: router, url: url}, callback);
    };

    /**
     * Returns a list of chats
     * @name Hitbox#chats
     * @public
     * @function
     * @param {object} params - params to add to function
     * @param {object} options - options for the ajax call
     * @param {function} callback - callback callback
     * @returns {Object} xhr - xDomainObject
     * @example
     */
    Hitbox.prototype.chats = function (params, options, callback) {
        options = options || {};
        var router = options.router || this.home_router,
            data = {},
            url = 'chat/servers';

        return this._get_message(data, {home_router: router, url: url}, callback);
    };

    /**
     * Connect to chat
     * @name Hitbox#chat_connect
     * @public
     * @function
     * @param {object} params - params to add to function
     * @param {object} options - options for the ajax call
     * @param {function} callback - callback callback
     * @returns {Object} xhr - xDomainObject
     * @example
     */
    Hitbox.prototype.chat_connect = function (params, options, callback) {
        options = options || {};
        var router = options.router || this.home_router,
            data = {},
            url = 'chat/servers',
            context = this;

        this.chats(null, null, function (error, response) {
            if (error) {
                return callback("Error getting chats list");
            }
            context._get_websocket_url({chats:response}, null, function (error, response) {
                if (error) {
                    return callback("Error getting websocket");
                }
                context.chat_socket = new WebSocket(response);
                context.chat_socket.onmessage = context._on_message;
            });
        });
    };

    /**
     * listeners for websocket
     * @name Hitbox#_on_message
     * @private
     * @function
     * @example
     */
    Hitbox.prototype._on_message = function (message) {
        var context = this;
        listeners.forEach(function (funct) {
            funct(message);
        });
    };

    /**
     * listeners for websocket
     * @name Hitbox#add_listener
     * @private
     * @function
     * @example
     */
    Hitbox.prototype.add_listener = function (listener) {
        listeners.push(listener);
    };

    /**
     * send a message on websocket
     * @name Hitbox#send_text
     * @public
     * @function
     * @param {object} message - the message to send
     * @returns {Object} xhr - xDomainObject
     * @example
     */
    Hitbox.prototype.send_message = function (message) {
        var context = this;
        if (this.chat_socket === undefined) {
            return "no socket";
        }

        this.chat_socket.send(JSON.stringify(message));
    };

    /**
     * create a websocket address
     * @name Hitbox#_create_websocket_url
     * @private
     * @function
     */
    Hitbox.prototype._create_websocket_url = function (params) {
        var random = false,
            index = 0,
            chats,
            url = '';

        if (params === undefined || params.chats === undefined || params.chats.length === 0) {
            callback('No chats provided');
        }

        chats = params.chats;

        if (params.random !== undefined) {
            random = params.random;
        }

        if (random) {
            index = Math.floor(Math.random() * (chats.length - 0));
        }


        url += chats[index].server_ip,
            url += '/socket.io/1/';

        return url;
    };

    /**
     * get a websocket address
     * @name Hitbox#_get_websocket_url
     * @private
     * @function
     */
    Hitbox.prototype._get_websocket_url = function (params, options, callback) {
        options = options || {};
        var router = options.router || this.home_router,
            data = {},
            url = '';

        if (params === undefined || params.chats === undefined || params.chats.length === 0) {
            return callback('No chats provided');
        }

        // Grab a random chat server, instead of always getting first
        try {
            url = this._create_websocket_url({chats: JSON.parse(params.chats), random: false});
        } catch (e) {
            return callback('error parsing chats list')
        }

        return this._get_message(data, {home_router: router, url: 'http://' + url}, function (error, response) {
            if (error) {
                return callback("Error getting chats list");
            }

            callback(null, 'ws://' + url + 'websocket/' + response.split(":")[0]);
        });
    };

    /**
     * Get the Authentication-Token
     * @name Hitbox#token
     * @public
     * @function
     * @param {object} data - data to append to end of url
     *   @param {string} login - specific team to lookup
     *   @param {string} pass - specific team to lookup
     * @param {object} options - options for the ajax call
     * @param {function} callback - callback callback
     * @returns {Object} xhr - xDomainObject
     * @example
     */
    Hitbox.prototype.token = function (params, options, callback) {
        options = options || {};
        var router = options.router || this.home_router,
            data = {},
            url = 'auth/token';

        if (params.login === undefined || params.pass === undefined) {
            return callback('Missing params');
        }

        data.login = params.login;
        data.pass = params.pass;
        data.app = "desktop";

        return this._post_message(data, {home_router: router, url: url}, callback);
    };

    /**
     * Get ingesting data
     * @name Hitbox#ingesting
     * @public
     * @function
     * @param {object} data - data to append to end of url
     *   @param {string} username - specific team to lookup
     *   @param {string} token - specific team to lookup
     * @param {object} options - options for the ajax call
     * @param {function} callback - callback callback
     * @returns {Object} xhr - xDomainObject
     * @example
     */
    Hitbox.prototype.ingesting = function (params, options, callback) {
        options = options || {};
        var router = options.router || this.home_router,
            data = {},
            url = 'streamingest/';

        if (params.username === undefined || params.token === undefined) {
            return callback('Missing params');
        }

        url += params.username;

        data.token = params.token;

        return this._get_message(data, {home_router: router, url: url}, callback);
    };

    return Hitbox;
});
