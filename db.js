
const sqlite = require('sqlite')
const dbPromise = sqlite.open(__dirname + '/data/detector.db', { Promise })

module.exports = dbPromise