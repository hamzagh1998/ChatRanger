const usernameForm = document.getElementById('username-form')
const msgInput = document.getElementById('msg-input')
const usersBox = document.getElementById('users-box')
const msgForm = document.getElementById('msg-form')
const msgBox = document.getElementById('msg-box')

const socket = io('/room')
socket.on('connect', () => joinRoom())

function joinRoom() {
  let username = localStorage.getItem('username')
  if (!username) {
    username = prompt('Enetr your name: ')
    if (username) {
      localStorage.setItem('username', username)
    } else {
      return location.reload()
    }
  }
  socket.emit('join-room', {username, socketId: socket.id, roomId: location.href.split('/').slice(-1)[0]})
}

socket.on('greeting', msg => msgBox.innerHTML += `<small class="text-secondary"> << ${msg} >> </small><br>`)
socket.on('leave-room', msg => msgBox.innerHTML += `<small class="text-secondary"> << ${msg} >> </small><br>`)
socket.on('connected-users', users => {
  usersBox.innerHTML = ''
  users.forEach(user => {
    if (user.socketId != socket.id) {
      usersBox.innerHTML += `<span class="m-2 user">${user.username}</span> | `
    }
  })
})
socket.on('get-msg', msg => msgBox.innerHTML += `<p class="msg msg-user">${msg}</p>`)
socket.on('illegal-room', () => location.href = '/')
socket.on('room-closed', () => location.href = '/')

function sendMsg(event) {
  event.preventDefault()
  const msgInput = event.target.firstElementChild
  msgBox.innerHTML += `<p class="msg bg-secondary">You: ${msgInput.value}</p>`
  socket.emit('send-msg', {username: localStorage.getItem('username'), msg: msgInput.value, roomId: location.href.split('/').slice(-1)[0]})
  msgInput.value = ''
}

// Event Listener
msgForm.addEventListener('submit', sendMsg)