const util = require('util');
const mysql = require('mysql');

const conn = createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'videocast'
});

conn.query = util.promisify(conn.query);

module.exports = conn;