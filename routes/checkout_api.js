const express = require('express');
const router = express.Router();
const { client } = require('../db/connection');
const { isAuthenticated } = require('../middleware/auth');

// Initialize Stripe with secret key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create Stripe Checkout Session
router.post('/checkout/create-session', isAuthenticated, async (req, res) => {
    try {
        // Get cart from session
        if (!req.session.cart || req.session.cart.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Cart is empty' 
            });
        }

        // Get shipping address from request body
        const { shippingAddress } = req.body;
        
        if (!shippingAddress || !shippingAddress.addressLine1 || !shippingAddress.city || 
            !shippingAddress.stateCode || !shippingAddress.postalCode || !shippingAddress.countryCode) {
            return res.status(400).json({ 
                success: false,
                message: 'Shipping address is required' 
            });
        }

        // Get full item details for cart items
        const itemIds = req.session.cart.map(item => item.itemId);
        const items = await client.query('SELECT * FROM items WHERE itemid = ANY($1)', [itemIds]);
        
        // Build line items for Stripe
        const lineItems = req.session.cart.map(cartItem => {
            const itemDetails = items.rows.find(item => item.itemid === cartItem.itemId);
            
            if (!itemDetails) {
                throw new Error(`Item with ID ${cartItem.itemId} not found`);
            }

            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: itemDetails.itemname,
                        description: itemDetails.description || '',
                    },
                    unit_amount: Math.round(itemDetails.price * 100), // Stripe uses cents
                },
                quantity: cartItem.quantity,
            };
        });

        // Build frontend URL with proper protocol
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const successUrl = `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${frontendUrl}/checkout`;

        console.log('Creating Stripe session with URLs:', { successUrl, cancelUrl });

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: req.user.email,
            shipping_address_collection: {
                allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES'],
            },
            metadata: {
                customerId: req.user.customerid.toString(),
                cartItems: JSON.stringify(req.session.cart),
                shippingAddress: JSON.stringify(shippingAddress)
            }
        });

        res.status(200).json({
            success: true,
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('Stripe checkout error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to create checkout session',
            error: error.message 
        });
    }
});

// Verify Stripe Checkout Session (after successful payment)
router.get('/checkout/verify-session/:sessionId', isAuthenticated, async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            // Create order in database (if not already created by webhook)
            try {
                const customerId = session.metadata.customerId;
                const cartItems = JSON.parse(session.metadata.cartItems);
                const amountTotal = session.amount_total / 100; // Convert from cents
                
                // Check if order already exists for this session
                const existingOrder = await client.query(
                    'SELECT * FROM orders WHERE createdby = $1 AND orderprice = $2 AND ABS(EXTRACT(EPOCH FROM (NOW() - orderdate))) < 300',
                    [customerId, amountTotal]
                );
                
                let orderId;
                
                if (existingOrder.rows.length === 0) {
                    // Get item IDs from cart
                    const itemIds = cartItems.map(item => item.itemId);
                    const items = await client.query('SELECT * FROM items WHERE itemid = ANY($1)', [itemIds]);
                    
                    // Create order
                    const orderResult = await client.query(
                        'INSERT INTO orders(customerid, orderprice, orderdate, orderstatus, createdby, createddate) VALUES($1, $2, NOW(), $3, $4, NOW()) RETURNING *',
                        [customerId, amountTotal, 'COMPLETED', customerId]
                    );
                    
                    orderId = orderResult.rows[0].orderid;
                    
                    // Insert order items
                    const values = cartItems.map(cartItem => {
                        return `(${orderId}, ${cartItem.itemId}, ${cartItem.quantity})`;
                    }).join(',');
                    
                    await client.query(`INSERT INTO orderitems(orderid, itemid, quantity) VALUES ${values}`);
                    
                    // Reduce inventory
                    for(const cartItem of cartItems){
                        await client.query('UPDATE items SET inventory = inventory - $1 WHERE itemid = $2', 
                            [cartItem.quantity, cartItem.itemId]);
                    };
                    
                    // Save shipping address if provided
                    if (session.metadata.shippingAddress) {
                        try {
                            const shippingAddress = JSON.parse(session.metadata.shippingAddress);
                            await client.query(
                                'INSERT INTO shippingaddress(orderid, shippingaddress1, shippingaddress2, city, statecode, countrycode, postalcode) VALUES($1, $2, $3, $4, $5, $6, $7)',
                                [
                                    orderId,
                                    shippingAddress.addressLine1,
                                    shippingAddress.addressLine2 || null,
                                    shippingAddress.city,
                                    shippingAddress.stateCode,
                                    shippingAddress.countryCode,
                                    shippingAddress.postalCode
                                ]
                            );
                            console.log('Shipping address saved for order:', orderId);
                        } catch (addressError) {
                            console.error('Error saving shipping address:', addressError);
                            // Don't fail the whole order if shipping address save fails
                        }
                    }
                    
                    console.log('Order created successfully:', orderId);
                } else {
                    orderId = existingOrder.rows[0].orderid;
                    console.log('Order already exists:', orderId);
                }
                
                // Clear cart after successful order
                if (req.session.cart) {
                    req.session.cart = [];
                }
                
                res.status(200).json({
                    success: true,
                    paid: true,
                    orderId: orderId,
                    session: {
                        id: session.id,
                        amount_total: session.amount_total,
                        currency: session.currency,
                        customer_email: session.customer_email,
                        payment_status: session.payment_status
                    }
                });
            } catch (dbError) {
                console.error('Database error creating order:', dbError);
                // Still return success for payment, but log the error
                res.status(200).json({
                    success: true,
                    paid: true,
                    session: {
                        id: session.id,
                        amount_total: session.amount_total,
                        currency: session.currency,
                        customer_email: session.customer_email,
                        payment_status: session.payment_status
                    },
                    orderCreationError: true
                });
            }
        } else {
            res.status(200).json({
                success: true,
                paid: false,
                payment_status: session.payment_status
            });
        }

    } catch (error) {
        console.error('Session verification error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to verify session',
            error: error.message 
        });
    }
});

// Stripe Webhook (for handling payment events)
router.post('/checkout/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('Payment successful:', session);
            
            // Create order in database
            try {
                const customerId = session.metadata.customerId;
                const cartItems = JSON.parse(session.metadata.cartItems);
                const amountTotal = session.amount_total / 100; // Convert from cents
                
                // Get item IDs from cart
                const itemIds = cartItems.map(item => item.itemId);
                const items = await client.query('SELECT * FROM items WHERE itemid = ANY($1)', [itemIds]);
                
                // Create order
                const orderResult = await client.query(
                    'INSERT INTO orders(customerid, orderprice, orderdate, orderstatus, createdby, createddate) VALUES($1, $2, NOW(), $3, $4, NOW()) RETURNING *',
                    [customerId, amountTotal, 'COMPLETED', customerId]
                );
                
                const orderId = orderResult.rows[0].orderid;
                
                // Insert order items
                const values = cartItems.map(cartItem => {
                    const item = items.rows.find(i => i.itemid === cartItem.itemId);
                    return `(${orderId}, ${cartItem.itemId}, ${cartItem.quantity})`;
                }).join(',');
                
                await client.query(`INSERT INTO orderitems(orderid, itemid, quantity) VALUES ${values}`);
                
                // Reduce inventory
                for(const cartItem of cartItems){
                    await client.query('UPDATE items SET inventory = inventory - $1 WHERE itemid = $2', 
                        [cartItem.quantity, cartItem.itemId]);
                };
                
                // Save shipping address if provided
                if (session.metadata.shippingAddress) {
                    try {
                        const shippingAddress = JSON.parse(session.metadata.shippingAddress);
                        await client.query(
                            'INSERT INTO shippingaddress(orderid, shippingaddress1, shippingaddress2, city, statecode, countrycode, postalcode) VALUES($1, $2, $3, $4, $5, $6, $7)',
                            [
                                orderId,
                                shippingAddress.addressLine1,
                                shippingAddress.addressLine2 || null,
                                shippingAddress.city,
                                shippingAddress.stateCode,
                                shippingAddress.countryCode,
                                shippingAddress.postalCode
                            ]
                        );
                        console.log('Shipping address saved for order:', orderId);
                    } catch (addressError) {
                        console.error('Error saving shipping address:', addressError);
                    }
                }
                
                console.log('Order created successfully:', orderId);
            } catch (error) {
                console.error('Error creating order:', error);
            }
            
            break;
        
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('PaymentIntent was successful:', paymentIntent);
            break;
        
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log('Payment failed:', failedPayment);
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});

module.exports = router;
