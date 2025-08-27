const express = require('express');
const router = express.Router();
const { client } = require('../db/connection');
const bcrypt = require('bcrypt');

//create new customer (registration)
router.post('/register', async (req, res) => {
    try{
        let body = req.body;
        let hash = await generatePasswordHash(body.password);
        console.log(hash);
        if (!body.password || !body.email || !body.firstName || !body.lastName) {
            return res.status(400).json("Missing required fields");
        }
        const createdBy = "admin";
        await client.query('INSERT INTO Customer(firstname, lastname, email, loginid, passwordhash, createdby, createddate) VALUES($1, $2, $3, $4, $5, $6, NOW())',
            [body.firstName, body.lastName, body.email, body.loginId, hash, createdBy]
        );
        res.status(200).json("registration completed successfully");
    }
    catch(err){
        console.log(err);
        res.status(500).json("Unable to create user");
    }
});


async function generatePasswordHash(password, saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10){
    try{
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    }
    catch(err){
        console.log(err);
    }
}

module.exports = router;