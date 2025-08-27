const express = require('express');
const router = express.Router(); 
const { client } = require('../db/connection');

router.get('/customers/:customerid', async (req, res) => {
    try{
        const customers = await client.query('SELECT * FROM customers WHERE customerid = $1', [req.params.customerid]);
        if(customers.rows.length === 0){
            res.status(404).json("No customer with the customer id found");
        }
        else{
            res.status(200).json({
                    customer: {
                        customerid: req.user.customerid,
                        firstname: req.user.firstname,
                        lastname: req.user.lastname,
                        email: req.user.email,
                        loginid: req.user.loginid
                    }
            });
        }
    }
    catch(err){
        res.status(500).json("No customer with the customer id found");
    }
});

router.put('/customers/update', async (req, res) => {
    try{
        const body = req.body; 
        const customerId = body.customerId;
        const lastupdatedby = 'admin';

        const result = await client.query('UPDATE customers SET firstname = $1, lastname = $2, email = $3, lastupdatedby = $4, lastupdateddate = NOW() WHERE customerid = $5' ,
                                [body.firstName, body.lastName, body.email, lastupdatedby, customerId]
                        );

        if (result.rowCount === 0) {
            return res.status(404).json("Customer not found");
        }

        res.status(200).json("customer updated successfully");
    }
    catch (err){
        res.status(500).json("error");
    }
});


module.exports = router;