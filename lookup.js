
let maxmind = require('maxmind')
let lookup = maxmind.openSync(__dirname + '/data/GeoLite2-City.mmdb')

// console.log(lookup.get('1.1.1.1').location)
module.exports = lookup