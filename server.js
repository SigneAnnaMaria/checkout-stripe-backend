require('dotenv').config()
const cors = require('cors')
const express = require('express')
const app = express()
const port = process.env.PORT || 3001
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const bcrypt = require('bcrypt')
const fs = require('fs')
const usersFile = 'users.json'

app.use(express.json())
app.use(cors())

let shoppingCart = {}

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)

    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'))
    users[email] = { email, password: hashedPassword }
    fs.writeFileSync(usersFile, JSON.stringify(users))

    res.status(201).send('User registered successfully')
  } catch (error) {
    res.status(500).send(`Error registering user:  ${error.message}`)
  }
})

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'))

    if (
      !users[email] ||
      !(await bcrypt.compare(password, users[email].password))
    ) {
      return res.status(401).send('Invalid credentials')
    }

    res.status(200).send('Logged in successfully')
  } catch (error) {
    res.status(500).send('Error logging in')
  }
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

app.post('/cart/add', (req, res) => {
  const { userId, productId, quantity } = req.body
  if (!shoppingCart[userId]) {
    shoppingCart[userId] = []
  }
  shoppingCart[userId].push({ productId, quantity })
  res.status(200).send('Product added to cart')
})

app.get('/cart/:userId', (req, res) => {
  const { userId } = req.params
  res.status(200).json(shoppingCart[userId] || [])
})

app.post('/cart/remove', (req, res) => {
  const { userId, productId } = req.body
  if (shoppingCart[userId]) {
    shoppingCart[userId] = shoppingCart[userId].filter(
      (item) => item.productId !== productId
    )
  }
  res.status(200).send('Product removed from cart')
})
