const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { client } = require('../db/connection');
const passport = require("passport");

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ 
                success: false,
                message: 'Internal server error',
                error: err.message 
            });
        }
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: info || 'Invalid credentials' 
            });
        }
        
        req.logIn(user, (err) => {
            if (err) {
                return res.status(500).json({ 
                    success: false,
                    message: 'Login failed',
                    error: err.message 
                });
            }
            
            return res.status(200).json({
                success: true,
                message: "Successfully logged in",
                customer: {
                    customerid: user.customerid,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email
                }
            });
        });
    })(req, res, next);
});

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ 
        success: false,
        message: 'Logout failed',
        error: err.message 
      });
    }
    res.status(200).json({ 
      success: true,
      message: "Successfully logged out" 
    });
  });
});

// Add a route to check authentication status
router.get('/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).json({
            authenticated: true,
            user: {
                customerid: req.user.customerid,
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                email: req.user.email
            }
        });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

module.exports = router;
