const { Client } = require('pg');
const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost', 
    database: process.env.DB_NAME || 'e_comm_app',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5433,
});

client.connect()
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Database connection error:', err));


module.exports = { client };