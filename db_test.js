const { client } = require('./db/connection');

async function testConnection(){
    try{
        await client.connect();
        const res = await client.query('SELECT NOW()');
        console.log('Database connected successfully:', res.rows[0]);
    }catch (err) {
        console.error('Database connection failed:', err);
    } finally {
        await client.end();
    }
}

testConnection();