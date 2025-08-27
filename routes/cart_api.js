const express = require('express');
const router = express.Router();
const { client } = require('../db/connection');

//set up the cart middleware
function initializeCart(req, res, next){
    if(!req.session.cart){
        req.session.cart =[];
    }
    next();
}

router.post('/cart/add', initializeCart, async (req, res) => {
    try{
        const { itemId, quantity } = req.body;
        
        if(!itemId || !quantity || quantity <= 0){
            return res.status(400).json({ message: 'Invalid item or quantity' });
        }

        const itemExists = await client.query('SELECT itemid FROM items WHERE itemid = $1', [itemId]);
        if (itemExists.rows.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const currentInventory = itemQuery.rows[0].inventory;
        
        // Check if we have enough stock
        if (quantity > currentInventory) {
            return res.status(400).json({ 
                message: `Only ${currentInventory} units available for ${itemQuery.rows[0].itemname}` 
            });
        }

        //check for existing item
        const existingItemIndex = req.session.cart.findIndex(item => item.itemId == itemId);

        if (existingItemIndex > -1) {
            // Update existing item (you could also add to existing quantity)
            req.session.cart[existingItemIndex].quantity = quantity;
        } else {
            // Add new item to cart
            req.session.cart.push({ itemId: parseInt(itemId), quantity: parseInt(quantity) });
        }

         res.status(200).json({ 
            message: 'Item added to cart',
            cart: req.session.cart 
        });
    }
    catch(err){
        console.log(err);
        res.status(500).json({ message: 'Error adding item to cart' });
    }
});

// GET CART (with item details)
router.get('/cart', initializeCart, async (req, res) => {
    try {
        if (req.session.cart.length === 0) {
            return res.status(200).json({ cart: [], total: 0 });
        }

        // Get full item details for cart items
        const itemIds = req.session.cart.map(item => item.itemId);
        const items = await client.query('SELECT * FROM items WHERE itemid = ANY($1)', [itemIds]);
        
        // Combine cart quantities with item details
        const enrichedCart = req.session.cart.map(cartItem => {
            const itemDetails = items.rows.find(item => item.itemid === cartItem.itemId);
            return {
                ...cartItem,
                itemName: itemDetails.itemname,
                price: itemDetails.price,
                description: itemDetails.description,
                subtotal: itemDetails.price * cartItem.quantity
            };
        });

        const total = enrichedCart.reduce((sum, item) => sum + item.subtotal, 0);

        res.status(200).json({ 
            cart: enrichedCart,
            total: total
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error retrieving cart' });
    }
});

// UPDATE ITEM QUANTITY
router.put('/cart/item/:itemId', initializeCart, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 0) {
            return res.status(400).json({ message: 'Invalid quantity' });
        }

        const itemIndex = req.session.cart.findIndex(item => item.itemId == itemId);
        
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        if (quantity === 0) {
            // Remove item if quantity is 0
            req.session.cart.splice(itemIndex, 1);
        } else {
            // Update quantity
            req.session.cart[itemIndex].quantity = parseInt(quantity);
        }

        res.status(200).json({ 
            message: 'Cart updated',
            cart: req.session.cart 
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error updating cart' });
    }
});

// REMOVE ITEM FROM CART
router.delete('/cart/item/:itemId', initializeCart, async (req, res) => {
    try {
        const { itemId } = req.params;
        
        const initialLength = req.session.cart.length;
        req.session.cart = req.session.cart.filter(item => item.itemId != itemId);
        
        if (req.session.cart.length === initialLength) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        res.status(200).json({ 
            message: 'Item removed from cart',
            cart: req.session.cart 
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error removing item from cart' });
    }
});

// CLEAR CART
router.delete('/cart', initializeCart, async (req, res) => {
    try {
        req.session.cart = [];
        res.status(200).json({ message: 'Cart cleared' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error clearing cart' });
    }
});

module.exports = router;