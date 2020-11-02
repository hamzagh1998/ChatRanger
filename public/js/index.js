const span = document.getElementById('username')
const usersBox = document.getElementById('users-box') 
const roomsBox = document.getElementById('rooms-box')
const usernameForm = document.getElementById('username-form')
const roomForm = document.getElementById('room-form')

function setUsername() {
  let username = localStorage.getItem('username')
  if (!username) {
    username = prompt('Enetr your name: ').trim()
    if (username) {
      localStorage.setItem('username', username)
    } else {
      return location.reload()
    }
  }
  socket.emit('logged-in', username)
  span.innerText = username
}

const socket = io()

socket.on('logged-failed', msg => {
  alert(msg)
  localStorage.removeItem('username')
  setUsername()
})
socket.on('create-failed', msg => alert(msg))
socket.on('connected-users', payload => {
  usersBox.innerHTML = ''
  payload.forEach(user => {
    if (socket.id != user.socketId) {
      usersBox.innerHTML += `<span class="m-2 user">${user.username}</span> | `
    }
  })
})
socket.on('available-room', rooms => {
  roomsBox.innerHTML = ''
  rooms.forEach(room => {
    roomsBox.innerHTML += `<a href="/room/${room.roomId}">${room.roomName}</a>  | `
  })
})
socket.on('join-room', url => location.href = `/room/${url}`)

setUsername()

function changeUsername(event) {
  event.preventDefault()
  const usernameInput = document.getElementById('username-input')
  if (usernameInput.value) {
    username = usernameInput.value.trim()
    localStorage.setItem('username', username)
    span.innerText = usernameInput.value
    socket.emit('change-username', {username: usernameInput.value, socketId: socket.id})
    usernameInput.value = ''
  } else {
    alert("This field couldn't be empty!")
  }
}

function createRoom(event) {
  event.preventDefault()
  const roomInput = document.getElementById('room-input')
  if (roomInput.value) {
    socket.emit('create-room', {roomName: roomInput.value, hostId: socket.id})
    roomInput.value = ''
  } else {
    alert("This field couldn't be empty!")
  }
}

// Event Listener
usernameForm.addEventListener('submit', changeUsername)
roomForm.addEventListener('submit', createRoom)