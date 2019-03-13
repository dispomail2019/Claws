let mongoose = require('mongoose');
const server = '127.0.0.1:27017'; // REPLACE WITH YOUR DB SERVER
const database = 'claws';      // REPLACE WITH YOUR DB NAME
class Database {
    constructor() {

    }
    async connect() {
        await mongoose.connect(`mongodb://${server}/${database}`)
            .then(() => {
                console.log('Database connection successful')
            })
            .catch(err => {
                console.error('Database connection error')
            })
        return mongoose.connection;
    }
}


module.exports = new Database()