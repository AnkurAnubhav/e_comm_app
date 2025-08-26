const express = require('express')
const router = express.Router();
const { client } = require('../db/connection');


// get all orders when GET request is made to the homepage
    router.get('/orders/customer/:customerId', async (req, res) => {
        try{
            const customerId = req.params.customerId;
            const orders = await client.query('SELECT * FROM orders WHERE CustomerId = $1', [customerId]);
            if(orders.rows.length === 0) {
                res.status(404).json({ message: "Order not found" });
            } else {
                res.status(200).json(orders.rows);
            }
        }
        catch(err){
            console.error(err);
            res.status(500).json({ error: 'Database error' });
        }
        
    });

//get an order based on the order id
    router.get('/orders/:orderId', async (req, res) => {
        console.log("received request");
        try{
            let orderId = req.params.orderId;
            console.log(`${orderId}`);
            const order = await client.query('SELECT * FROM orders WHERE OrderId = $1', [orderId]);
            if(order.rows.length === 0) {
                res.status(404).json({ message: "Order not found" });
            } else {
                res.status(200).json(order.rows);
            }
            
        }
        catch(err){
            console.error(err);
            res.status(500).json({ error: 'Database error' });
        }
        
    });

    //post an order based on the payload
    router.post('/orders/postOrder', async (req, res) => {
        console.log("request Received");
        try{
            let body = req.body;
            if(body.shippingAddress.addressLine1 == null || body.items.length == 0){
                res.status(400).json("invalid order. Cannot be added");
            }
            else{
                const status = "PENDING";
                const calculatedTotal = body.items.reduce((total, item) => {
                    return total + (item.price * item.quantity);
                }, 0);
                //Insert Shipping address
                const response = await client.query('INSERT INTO Orders(CustomerId, OrderPrice, OrderDate, OrderStatus, CreatedBy, CreatedDate) VALUES($1, $2, NOW(), $3, $4, NOW()) RETURNING *',
                    [body.customerId, calculatedTotal, status, body.customerId]);
                
                console.log(response);
                const orderId = response.rows[0].orderid; // Note: PostgreSQL returns lowercase
                console.log("Generated OrderId:", orderId);

                //Insert the record for Shipping address 
                await client.query(
                    'INSERT INTO ShippingAddress(OrderId, ShippingAddress1, ShippingAddress2, City, StateCode, CountryCode, PostalCode) VALUES($1, $2, $3, $4, $5, $6, $7)',
                    [orderId, body.shippingAddress.addressLine1, body.shippingAddress.addressLine2, body.shippingAddress.city, body.shippingAddress.stateCode, body.shippingAddress.countryCode, body.shippingAddress.postalCode]
                );

                //Insert the record for the orderItem table
                const values = body.items.map(item => `(${orderId}, ${item.itemId}, ${item.quantity})`).join(',');
                await client.query(`INSERT INTO OrderItems(orderid, itemid, quantity) VALUES ${values}`);
                res.status(200).json("Order placed successfully");
            }
        }
        catch(err){
            console.error(err);
            res.status(500).json({ error: 'Database error' });
        }
    });

module.exports = router;