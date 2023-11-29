require('dotenv').config()
const cors = require('cors')
const express = require('express')
const app = express()
const port = process.env.PORT || 3001
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const bcrypt = require('bcrypt')
const fs = require('fs')
const usersFile = 'users.json'
const ordersFile = 'orders.json'

if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify({}))
}

if (!fs.existsSync(ordersFile)) {
  fs.writeFileSync(ordersFile, JSON.stringify({}))
}

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
    try {
      fs.writeFileSync(usersFile, JSON.stringify(users))
      console.log('Data written to users.json successfully')
    } catch (error) {
      console.error('Error writing to users.json:', error)
    }

    res.status(201).send('User registered successfully')
  } catch (error) {
    res.status(500).send(`Error registering user:  ${error.message}`)
  }
})

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'))
    console.log('users', users)

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

app.post('/create-checkout-session', async (req, res) => {
  try {
    console.log('place order req', req.body)
    const { items } = req.body 

    const lineItems = items.map((item) => {
      return {
        price: item.priceId,
        quantity: item.quantity,
      }
    })
    console.log('place order 2')
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/checkout-success`, 
      cancel_url: `${req.headers.origin}/checkout-failed`, 
    })

    res.status(200).json({ sessionId: session.id })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/confirm-order', async (req, res) => {
  try {
    const orderDetails = req.body
    const user = orderDetails.user
    console.log('orderDetails', orderDetails)
    console.log('user', user)
    let orders = {}
    if (fs.existsSync(ordersFile)) {
      orders = JSON.parse(fs.readFileSync(ordersFile, 'utf-8'))
    }

    if (!orders[user]) {
      orders[user] = []
    }
    console.log('before adding order orders', orders)

    const now = new Date()
    const formattedDate = `${now.toISOString().slice(0, 19).replace('T', ' ')}`

    orders[user].push({ dateTime: formattedDate, items: orderDetails.items })

    console.log('after adding order orders', orders)

    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2))

    res.status(200).send('Order confirmed')
  } catch (error) {
    res.status(500).send('Error confirming order')
  }
})

app.get('/orders/:user', async (req, res) => {
  try {
    const user = req.params.user
    console.log('getting orders for user: ', user)
    let orders = {}
    if (fs.existsSync(ordersFile)) {
      orders = JSON.parse(fs.readFileSync(ordersFile, 'utf-8'))
    }

    res.status(200).json(orders[user] || [])
  } catch (error) {
    res.status(500).send('Error retrieving orders')
  }
})
