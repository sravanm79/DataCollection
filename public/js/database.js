/*
*   This script has been generated for the project titled
*   "SPEECH TO SPEECH TRANSLATION SYSTEM FOR TRIBAL LANGUAGES"
*   The original author of the script is
*   Swapnil S Sontakke, Project Associate, IIIT, Dharwad
*   Year: February, 2022
*   Version: 2
*/

/* This file is used to create and connect to the MySQL database */
const mysql = require('mysql');

function connectWithRetry() {
    const connection = mysql.createConnection({
        host: 'db',               // Docker service name
        user: 'root',
        password: 'yourpassword', // Use same as in docker-compose.yml
        database: 'hospitaldb'    // Match with your .sql file
    });

    connection.connect(err => {
        if (err) {
            console.error('Failed to connect to MySQL, retrying in 5s...', err);
            setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
        } else {
            console.log('Connected to MySQL');
        }
    });

    return connection;
}

const db = connectWithRetry();
module.exports = db;
