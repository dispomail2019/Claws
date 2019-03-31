'use strict';
const { queue } = require('../../utils/queue');

module.exports.providers = {
    movies: [
        new (require('./movies/Afdah'))(queue),
        new (require('./movies/AZMovies'))(queue),
        new (require('./movies/bfmovies'))(queue),
        new (require('./movies/StreamM4u'))(queue),
        //require('./movies/MovieFiles'),
        new (require('./movies/DLFilm'))(queue)
    ],
    tv: [
        new (require('./tv/SeriesFree'))(queue),
        new (require('./tv/GoWatchSeries'))(queue),
        new (require('./tv/SwatchSeries'))(queue),
        new (require('./tv/ProjectFreeTV'))(queue)
        //require('./tv/AfdahTV'),
    ],
    anime: [
        new (require('./anime/AnimePahe'))(),
    ],
    universal: [
        new (require('./universal/Cache'))(),
        new (require('./universal/123movie'))(queue),
        new (require('./universal/ODB'))(queue),
        new (require('./universal/Series8'))(queue),
        //require('./universal/5movies')
        // new (require('./universal/FardaDownload'))(queue)
    ]
};

module.exports.queue = queue;