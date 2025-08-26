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

module.exports = router;

