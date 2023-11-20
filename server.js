require('dotenv').config()
const cors = require('cors')
const express = require('express')
const app = express()
const port = process.env.PORT || 3001
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

app.get('/products', async (req, res) => {
  try {
    const products = await stripe.products.list({
      expand: ['data.default_price'],
    })
    res.status(200).json(products)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
