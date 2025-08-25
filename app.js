const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const orderRoutes = require('./routes/orders_api');

// Add this line to parse JSON request bodies
app.use(express.json());

app.use('/api', orderRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Ecommerce app listening on port ${port}`)
})