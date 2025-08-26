const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const orderRoutes = require('./routes/orders_api');
const registrationRoutes = require('./routes/registration_api');
const rateLimit = require('express-rate-limit');

// Add this line to parse JSON request bodies
app.use(express.json());

const globalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later'
});

app.use(globalRateLimit);

app.use('/api', orderRoutes);
app.use('/api', registrationRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Ecommerce app listening on port ${port}`)
})