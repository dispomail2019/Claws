'use strict';

module.exports = exports = {
    movies: [
        // new (require('./movies/Afdah'))(),
        // new (require('./movies/AZMovies'))(),
        // new (require('./movies/bfmovies'))(),
        // new (require('./movies/StreamM4u'))(),
        // require('./movies/MovieFiles'),
    ],
    tv: [
        // new (require('./tv/SeriesFree'))(),
        // new (require('./tv/GoWatchSeries'))(),
        // new (require('./tv/SwatchSeries'))(),
        // require('./tv/AfdahTV'),
        // new (require('./tv/series8'))()
    ],
    anime: [],
    universal: [
        // new (require('./universal/123movie'))(),
        // new (require('./universal/ODB'))(),
        new (require('./universal/Cache'))()
        //require('./universal/5movies')
    ]
};
