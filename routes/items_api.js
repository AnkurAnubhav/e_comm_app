const express = require('express');
const router = express.Router();
const { client } = require('../db/connection');

router.get('/items', async (req, res) => {
    try{
        const items = await client.query('SELECT * FROM items');
            if(items.rows.length === 0) {
                res.status(500).json({ message: "No Items Found" });
            } else {
                res.status(200).json(items.rows);
            }
    }
    catch(err){
        console.log(err);
        res.status(500).json({ message: "No Items Found" });
    }
});

router.get('/items/itemname/:itemname', async (req, res) => {
    try{
        const searchTerm = `%${req.params.itemname.toLowerCase()}%`;
        const items = await client.query('SELECT * FROM items WHERE itemname ILIKE $1', [searchTerm]);
            if(items.rows.length === 0) {
                res.status(500).json({ message: "No Items Found" });
            } else {
                res.status(200).json(items.rows);
            }
    }
    catch(err){
        console.log(err);
        res.status(500).json({ message: "No Items with the matching name found" });
    }
});

router.get('/items/category/:category', async (req, res) => {
    try{
        const items = await client.query('SELECT * FROM items WHERE category = $1', [req.params.category]);
            if(items.rows.length === 0) {
                res.status(500).json({ message: "No Items with the category found" });
            } else {
                res.status(200).json(items.rows);
            }
    }
    catch(err){
        console.log(err);
        res.status(500).json({ message: "No Items with the category found" });
    }
});

module.exports = router;