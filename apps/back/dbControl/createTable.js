const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function setupDatabase() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            multipleStatements: true
        });
        const User = `
            CREATE TABLE IF NOT EXISTS \`User\` (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user'
            )
        `;

        const Tables = `
            CREATE TABLE IF NOT EXISTS Tables (
                id INT AUTO_INCREMENT PRIMARY KEY,
                player INT NOT NULL,
                cost INT NOT NULL
            )
        `;

        const Game = `
            CREATE TABLE IF NOT EXISTS Game (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                player INT NOT NULL,
                remain INT NOT NULL
            )
        `;

        const statistic = `
            CREATE TABLE IF NOT EXISTS statistic (
                id INT AUTO_INCREMENT PRIMARY KEY,
                timeStart DATETIME DEFAULT CURRENT_TIMESTAMP,
                total INT NOT NULL,
                game JSON
            )
        `;

        const rentTables = `
            CREATE TABLE IF NOT EXISTS rentTables (
                id INT AUTO_INCREMENT PRIMARY KEY,
                userID INT NOT NULL,
                tablesID INT NOT NULL,
                remainPlayer INT NOT NULL,
                FOREIGN KEY (userID) REFERENCES \`User\`(id),
                FOREIGN KEY (tablesID) REFERENCES Tables(id)
            )
        `;

        const rentGame = `
            CREATE TABLE IF NOT EXISTS rentGame (
                id INT AUTO_INCREMENT PRIMARY KEY,
                rentTablesID INT NOT NULL,
                gameID INT NOT NULL,    
                FOREIGN KEY (rentTablesID) REFERENCES rentTables(id),
                FOREIGN KEY (gameID) REFERENCES Game(id)
            )
        `;

        await connection.execute(User);
        await connection.execute(Tables);
        await connection.execute(Game);
        await connection.execute(statistic);
        await connection.execute(rentTables);
        await connection.execute(rentGame);

        console.log('Create all tables');
    } catch (error) {
        console.error('error: ', error.message);
    } finally {
        await connection.end();
    }
}

setupDatabase();