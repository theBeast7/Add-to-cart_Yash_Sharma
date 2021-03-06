const mysql = require("mysql");

const conn = mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'testdb'
});

conn.connect((err) => {
    if (err) {
        console.log('err in database connection : ', err);
    } else {
        console.log("Database Connected !!!");
    }
})

module.exports = conn;