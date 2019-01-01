
const lookup = require('./lookup')
const express = require('express')
const dbPromise = require('./db')
const haversine = require('haversine-distance')

const app = express()
app.use(express.json());

const port = process.env.PORT || 5000
const speed_threshold = 500

app.post('/v1', async (req, res) => {
    let response = {}
    response['currentGeo'] = get_location(req.body.ip_address)    
    await insert(req.body, response['currentGeo'])
    response['precedingIpAccess'] = await get_access_details(req.body, 'previous')
    response['subsequentIpAccess'] = await get_access_details(req.body, 'subsequent')
    response['travelToCurrentGeoSuspicious'] = response['precedingIpAccess'].speed > speed_threshold
    response['travelFromCurrentGeoSuspicious'] = response['subsequentIpAccess'].speed > speed_threshold
    res.send(response)
})

app.listen(port)

// Insert into DB
async function insert(payload, location) {
    try {
        const db = await dbPromise
        let sql = 'insert into login_geo_location(username, event_uuid,ip_address, unix_timestamp, lat, lon, radius) values(?,?,?,?,?,?,?);'
        let values = [payload.username, payload.event_uuid, payload.ip_address, payload.unix_timestamp, location.lat, location.lon, location.radius]
        await db.get(sql, values)
    } catch (error) {
        console.log(error)
    }
}

function get_speed(event1, event2) {

    loc1 = lookup.get(event1.ip_address).location
    loc2 = lookup.get(event2.ip_address).location

    // Convert to miles
    distance = (haversine(loc1, loc2) + loc1.accuracy_radius + loc2.accuracy_radius) * 0.625

    // miles per hour
    speed = (distance / Math.abs(event1.unix_timestamp - event2.unix_timestamp)) * 3600
    return Math.round(speed)
}

function get_location(ip) {
    response = {}
    location = lookup.get(ip).location    
    response['lat'] = location.latitude
    response['lon'] = location.longitude
    response['radius'] = location.accuracy_radius
    return response
}

async function query_db(sql, values) {
    try {
        const db = await dbPromise
        let result = await db.get(sql, values)
        return result
    } catch (error) {
        console.log(error)
    }
}

async function get_access_details(payload, type) {
    let return_val = {}
    let sql = `select ip_address, unix_timestamp, lat, lon, radius from login_geo_location where username=? and unix_timestamp 
                ${type == 'previous' ? '<' : '>'} ?  order by unix_timestamp 
                ${type == 'previous' ? 'desc' : ''} limit 1`
    let values = [payload.username, payload.unix_timestamp]
    let db_result = await query_db(sql, values)

    if (!db_result) return return_val

    return_val['ip'] = db_result.ip_address
    return_val['speed'] = get_speed(payload, db_result)
    return_val['lat'] = db_result.lat
    return_val['lon'] = db_result.lon
    return_val['radius'] = db_result.radius
    return_val['timestamp'] = db_result.unix_timestamp

    return return_val
}
