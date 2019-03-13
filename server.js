'use strict';

// Import dependencies
const express = require('express');
const logger = require('./src/utils/logger');

// Load and define application data
const pkg = require('./package.json');
require('dotenv').config();
const pathToApp = __dirname;

// Initialize express
let app = express();
const db = require('./src/db/db')
db.connect();
// Add renderer.
app.engine('html', require('ejs').__express);
app.set('views', 'public'); // render from the public directory.
app.set('view engine', 'html');

// Load external ExpressJS middleware
const compression = require('compression');

app.use(require('body-parser').json({limit: '10mb'}));
app.use(compression({filter: (req, res) => {
    if (req.headers['x-no-compression'] || req.headers['accept'] === 'text/event-stream') {
        // don't compress responses with this request header
        return false;
    }

    // fallback to standard filter function
    return compression.filter(req, res)
}}));

// Middleware: Initialise logging.
app.use(require('morgan')('tiny', {stream: logger.stream}));

// Middlware: Add headers to API.
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "origin, X-Requested-With, Content-Type, Accept");
    next();
});


/** RENDERED ROUTES **/
app.get('/', function(req, res) {
    if (process.env.NODE_ENV === 'production') {
        // When in production, redirect to the main site.
        res.redirect("https://apollotv.xyz/");
    } else {
        // Otherwise, render the index file with the secret client id set.
        res.render('index', {secret_client_id: process.env.SECRET_CLIENT_ID, tmdb_api_key: process.env.TMDB_API_KEY});
    }
});
app.get('/salsa20.min.js', (req, res) => res.sendFile(`${pathToApp}/public/salsa20.min.js`));
/** ./RENDERED ROUTES **/


/** API ROUTES **/
const generalRoutes = require('./src/api/generalRoutes');
app.use('/api/v1', generalRoutes);

const authRoutes = require('./src/api/authRoutes');
app.use('/api/v1', authRoutes);

/** ./API ROUTES **/

const http = require('http');
const WebSocket = require('ws');
const URL = require('url');
const {verifyToken} = require('./src/utils');
const resolveLinks = require('./src/api/resolveLinks');
const resolveHtml = require('./src/scrapers/resolvers/resolveHtml');

//initialize a simple http server
const server = http.createServer(app);

async function verifyClient({req}) {
    const token = URL.parse(req.url, true).query.token;
    const {auth} = await verifyToken(token);
    return auth;
}

//initialize the WebSocket server instance
const wss = new WebSocket.Server({server, verifyClient});

wss.on('connection', async (ws, req) => {
    ws.isAlive = true;

    ws.on('pong', () => {
        ws.isAlive = true;
    });

    //connection is up, let's add a simple simple event
    ws.on('message', async (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (err) {
            logger.warn(err);
            ws.send(`{"message": "That was not a JSON object..."}`);
            return;
        }

        if (data.type == 'resolveHtml') {
            try {
                const results = await resolveHtml(Buffer.from(data.html, 'base64').toString(), data.resolver, data.headers, data.cookie);
                ws.send(JSON.stringify({event: 'scrapeResults', results}));
            } catch(err) {
                ws.send(`{"event": "scrapeResults", "error": "${(err.message || err.toString()).substring(0, 100) + '...'}"}`);
                logger.error(err);
            }
        } else {
            resolveLinks(data, ws, req);
        }
    });
});

setInterval(() => {
    wss.clients.forEach((ws) => {

        if (!ws.isAlive) {
            return ws.terminate();
        }

        ws.isAlive = false;
        try {
            ws.ping(null, false, true);
        } catch (err) {
            console.log("WS client disconnected, can't ping");
            ws.terminate();
        }
    });
}, 10000);

// Start listening...
server.listen(process.env.PORT, () => {
    logger.info(`${pkg.name} v${pkg.version} server listening on: http://127.0.0.1:${process.env.PORT}`);
});