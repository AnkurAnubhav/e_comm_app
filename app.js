require('dotenv').config();
const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const orderRoutes = require('./routes/orders_api');
const registrationRoutes = require('./routes/registration_api');
const authRoutes = require('./routes/auth_api');
const itemsRoutes = require('./routes/items_api');
const customersRoute = require('./routes/customers_api');
const cartsRoute = require('./routes/cart_api');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { client } = require('./db/connection');
const bcrypt = require('bcrypt');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Add this line to parse JSON request bodies
app.use(express.json());

//Add rate limits
const globalRateLimit = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests, please try again later'
});

app.use(globalRateLimit);
//initialize session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret",
    cookie: { 
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 300000000, 
      secure: process.env.SESSION_SECURE === 'true' 
    },
    saveUninitialized: false,
    resave: false,
  })
);

//set passport
passport.serializeUser((customer, done) => {
  done(null, customer.customerid);
});

passport.deserializeUser(async (customerid, done) => {
   var response = await client.query('SELECT * FROM customer WHERE customerid = $1', [customerid]);
   if(response.err){
    return done(response.err);
   }
   done(null, response.rows[0]);
});

passport.use(new LocalStrategy({
        usernameField: 'loginid',
        passwordField: 'password'    
    }, function verify(loginid, password, cb){
        client.query('SELECT * FROM customer WHERE loginid = $1', [loginid], async function(err, customer) {
            if(err) {return cb(err); }

            if(customer.rows.length == 0) {return cb(null, false, 'Incorrect username or password'); }

            try{
                if(await bcrypt.compare(password, customer.rows[0].passwordhash)){
                    return cb(null, customer.rows[0]);
                }else{
                    return cb(null, false, 'Incorrect username or password'); 
                }
            }
            catch(err){
                console.log(err);
                cb(err);
            }
        })
}));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists
        const existingUser = await client.query(
            'SELECT * FROM customer WHERE email = $1', 
            [profile.emails[0].value]
        );

        if (existingUser.rows.length > 0) {
            // User exists, return the user
            return done(null, existingUser.rows[0]);
        } else {
            // Create new user
            const newUser = await client.query(
                `INSERT INTO customer(firstname, lastname, email, loginid, passwordhash, createdby, createddate) 
                 VALUES($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
                [
                    profile.name.givenName,
                    profile.name.familyName,
                    profile.emails[0].value,
                    profile.emails[0].value, // Use email as loginid for OAuth users
                    'oauth_user', // Placeholder password for OAuth users
                    'google_oauth'
                ]
            );
            return done(null, newUser.rows[0]);
        }
    } catch (error) {
        return done(error, null);
    }
}));

//Add passport for login and session
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', orderRoutes);
app.use('/api', registrationRoutes);
app.use('/api', authRoutes);
app.use('/api', itemsRoutes);
app.use('/api', customersRoute);
app.use('/api', cartsRoute);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Ecommerce app listening on port ${port}`)
})