'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')

const db = require('./db')

var jsonParser = bodyParser.json()
const app = express()
const port = 3000

app.use(jsonParser)

app.post('/sign-up', async (req, res) => {
  const { username, password } = req.body
  const user = await db.insert('users', {
    username: username.toLowerCase(),
    password,
  })
  res.status(201).send(user)
})

app.post('/sign-in', async (req, res) => {
  const { username, password } = req.body
  const users = await db.getAll('users')

  let user

  for (const item of users ) {
    if (item.username === username) {
      user = item
      break
    }
  }

  if (!user) {
    res.sendStatus(404)
    return
  }

  if (user.password !== password) {
    res.sendStatus(401)
    return
  }

  const session = await db.insert('sessions')
  const token = jwt.sign({ session: session.id }, 'some_private_key')

  res.send({
    user,
    token,
  })
})

app.use(async (req, res, next) => {
  const auth = req.headers.authorization

  if (!auth) {
    res.sendStatus(401)
  }

  let sessionId

  try {
    const buff = Buffer.from(auth.split(' ')[1], 'base64')
    const token = jwt.verify(buff.toString('utf8'), 'some_private_key')
    sessionId = token.session
  } catch (err) {
    console.error(err)
    res.sendStatus(401)
    return
  }

  const session = await db.get('sessions', sessionId)

  if (!session) {
    res.sendStatus(401)
    return
  }

  req.user = { sessionId }

  await next()
})

app.post('/logout', async (req, res) => {
  await db.remove('sessions', req.user.sessionId)
  res.sendStatus(204)
})

app.get('/users', async (req, res) => {
  res.send(await db.getAll('users'))
})

app.get('/users/:id', async (req, res) => {
  const user = await db.get('users', req.params.id)
  if (user) {
    res.send(user)
  } else {
    res.sendStatus(404)
  }
})

app.delete('/users/:id', async (req, res) => {
  res.send(await db.remove('users', req.params.id))
})

app.put('/users/:id', async (req, res) => {
  const { username, password } = req.body
  let user

  try {
    user = await db.update('users', req.params.id, {
      username: username.toLowerCase(),
      password,
    })
  } catch (err) {
    console.error(err)
    res.sendStatus(404)
    return
  }
  
  res.send(user)
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
