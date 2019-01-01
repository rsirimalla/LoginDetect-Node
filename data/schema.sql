-- Schema definition for storing logn information
DROP TABLE IF EXISTS login_geo_location;

CREATE TABLE login_geo_location (
    id integer PRIMARY KEY,
    username text NOT NULL,
    event_uuid text NOT NULL UNIQUE,
    ip_address text NOT NULL,
    unix_timestamp timestamp NOT NULL,
    lat real NOT NULL,
    lon real NOT NULL,
    radius integer NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

