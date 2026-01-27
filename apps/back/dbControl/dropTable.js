const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function dropAllTables() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        await connection.execute('DROP TABLE IF EXISTS rentGame');
        await connection.execute('DROP TABLE IF EXISTS rentTables');
        await connection.execute('DROP TABLE IF EXISTS statistic');
        await connection.execute('DROP TABLE IF EXISTS Game');
        await connection.execute('DROP TABLE IF EXISTS Tables');
        await connection.execute('DROP TABLE IF EXISTS User');
        console.log('Dropped all tables');
    } catch (error) {
        console.error('error ', error.message);
    } finally {
        await connection.end();
    }
}

dropAllTables();