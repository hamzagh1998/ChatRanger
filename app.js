require('dotenv').config()
const path = require('path')
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)

let connectedUser = [] // { username, socketId }
const rooms = [] // { roomId, hostId, roomName, hostName, users: [{ username, socketId  }] }

// ============================== middleware ==============================
app.use(express.static(path.join(__dirname, 'public')))

// ============================== routes ==============================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')))
app.get('/room/:slug', (req, res) => res.sendFile(path.join(__dirname, 'room.html')))

function checkUsername(users, username, socket) {
  if (users.filter(user => user.username === username).length > 0) {
    socket.emit('logged-failed', 'This username already exists!')
    return false
  }
  return true
}

function checkRoomIdx(roomId) {
  for (room in rooms) {
    if (rooms[room].roomId === roomId) {
      return room 
    }
  }
  return -1
}

function checkRoom(payload) {
  const roomIdx = checkRoomIdx(payload.roomId)
  if (roomIdx > -1) {
    if (rooms[roomIdx].hostId === null) { // push the host id and host name to the room
      rooms[roomIdx].hostId = payload.socketId
      rooms[roomIdx].hostName = payload.username
    } else {
      if (
          rooms[roomIdx].users.filter(user => user.username === payload.username).length > 0 ||
          rooms[roomIdx].hostName === payload.username
         ) {
           return false
         } else {
           rooms[roomIdx].users.push({socketId: payload.socketId, username: payload.username}) // push user
         }
    }
    return true
  } return false
}


function getConnectedUsers(roomId) {
  const room = rooms.filter(room => room.roomId === roomId)
  if (room.length > 0) {
    return {roomName: room[0].roomName, hostName: room[0].hostName, users: room[0].users}
  } return false
}

// ============================== room nsp ==============================
const roomNsp = io.of('/room')

roomNsp.on('connect', socket => {
  // On join room
  socket.on('join-room', payload => {
    if (checkRoom(payload)) {
      socket.join(payload.roomId)
      socket.username = payload.username
      socket.roomId = payload.roomId
      const room = getConnectedUsers(payload.roomId)
      if (room) {
        // Sending the connected users of a specific room
        roomNsp.to(payload.roomId).emit('connected-users', room)
      }
    } else {
      socket.join(socket.id).emit('illegal-join')
    } 
    socket.to(payload.roomId).broadcast.emit('greeting', `${payload.username} join the room!`)
    // On send message
    socket.on('send-msg', payload => {
      socket.to(payload.roomId).broadcast.emit('get-msg', `${payload.username}: ${payload.msg}`)
    })
  })
  // On disconnect
  socket.on('disconnect', () => {
    for (roomIdx in rooms) {
      if (rooms[roomIdx].hostId === socket.id) {
        roomNsp.to(rooms[roomIdx].roomId).emit('room-closed')
        rooms.splice(roomIdx, 1)
      } else {
        rooms[roomIdx].users.forEach((user, idx) => {
          if (user.socketId === socket.id) {
            rooms[roomIdx].users.splice(idx, 1)
          }
        })
      }      
    }
    const room = getConnectedUsers(socket.roomId)
    if (room) {
      // Sending the connected users of a specific room
      roomNsp.to(socket.roomId).emit('connected-users', room)
    }      
    roomNsp.to(socket.roomId).emit('leave-room', `${socket.username} left the room!`)
  })
})

// ============================== main nsp ==============================
io.on('connect', socket => {
  // On logged-in
  socket.on('logged-in', username => {
    if (checkUsername(connectedUser, username, socket)) {
      connectedUser.push({username, socketId: socket.id})
      io.emit('connected-users', connectedUser)
    }
  })
  // On change username
  socket.on('change-username', payload => {
    if (checkUsername(connectedUser, payload.username, socket)) {
      connectedUser.forEach(user => {
        if (user.socketId === payload.socketId) {
          user.username = payload.username
          io.emit('connected-users', connectedUser)
        }
      })
    } else {
      connectedUser = connectedUser.filter(user => user.socketId != socket.id)
    }
  })
  // On create room
  socket.on('create-room', payload => {
    const checkRoomName = rooms.filter(room => room.roomName === payload.roomName) 
    if (checkRoomName.length > 0) {
      socket.emit('create-failed', 'This room already exists!')
    } else {
      rooms.push({roomId: socket.id, hostId: null, roomName: payload.roomName, users: []})
      io.emit('available-room', rooms)
      socket.emit('join-room', socket.id)
    }
  })
  // Emit available rooms
  io.emit('available-room', rooms)
  // On disconnect
  socket.on('disconnect', () => {
    connectedUser = connectedUser.filter(user => user.socketId != socket.id)
    io.emit('connected-users', connectedUser)
  })
})



const PORT = process.env.PORT || 4000

server.listen(PORT, console.log(`Server run on port: ${PORT}!`))