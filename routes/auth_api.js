const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { client } = require('../db/connection');
const passport = require("passport");

router.post('/login', passport.authenticate('local'), (req, res) => {
    res.status(200).json({
        message: "Successfully logged in",
        customer: {
            customerid: req.user.customerid,
            firstname: req.user.firstname,
            lastname: req.user.lastname,
            email: req.user.email
        }
    });
});

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.status(200).json("Successfully logged out");
  });
});

// Google OAuth login route
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback route
router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication, redirect to frontend
        res.redirect('http://localhost:5173/?login=success');
    }
);

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

