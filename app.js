require('dotenv').config()
const path = require('path')
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)

// ============================== middleware ==============================
app.use(express.static(path.join(__dirname, 'public')))

// ============================== routes ==============================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')))
app.get('/room/:slug', (req, res) => res.sendFile(path.join(__dirname, 'room.html')))

const PORT = process.env.PORT || 4000

server.listen(PORT, console.log(`Server run on port: ${PORT}!`))