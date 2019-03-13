let mongoose = require('mongoose')
let cacheSchema = new mongoose.Schema({
    uri: String,
    type: String,
    metadata: {
        title: String,
        provider: String,
        season: String,
        episode: String,
        year: String,
        headers: {},
    },
    ttl: { type: Date, default: Date.now, expires: 43200},
    searched: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Cache', cacheSchema)