const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const orderRoutes = require('./routes/orders_api');
const registrationRoutes = require('./routes/registration_api');
const authRoutes = require('./routes/auth_api');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { client } = require('./db/connection');
const bcrypt = require('bcrypt');
const session = require('express-session');

// Add this line to parse JSON request bodies
app.use(express.json());

//Add rate limits
const globalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later'
});

app.use(globalRateLimit);
//initialize session
app.use(
  session({
    secret: "f4z4gs$Gcg",
    cookie: { maxAge: 300000000, secure: false },
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

//Add passport for login and session
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', orderRoutes);
app.use('/api', registrationRoutes);
app.use('/api', authRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Ecommerce app listening on port ${port}`)
})