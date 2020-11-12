const usernameForm = document.getElementById('username-form')
const msgInput = document.getElementById('msg-input')
const usersBox = document.getElementById('users-box')
const msgForm = document.getElementById('msg-form')
const msgBox = document.getElementById('msg-box')
const roomName = document.getElementById('roomName')
const hostName = document.getElementById('hostName')

const slug = location.href.split('/').slice(-1)[0].split('#')[0]
console.log(slug)

const socket = io('/room')
socket.on('connect', () => joinRoom())

function scrollToBottom(messages) {
  const shouldScroll = messages.scrollTop + messages.clientHeight === messages.scrollHeight
  if (!shouldScroll) {
    messages.scrollTop = messages.scrollHeight;
  }
}

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
  socket.emit('join-room', {username, socketId: socket.id, roomId: slug})
}

// socket.on('join-failed', msg => alert(msg))
socket.on('greeting', msg => {
  msgBox.innerHTML += `<p class="bg-success text-light text-center rounded p-2 m-2">${msg}</p>`
  scrollToBottom(msgBox.parentElement)
})
socket.on('joining', msg => {
  msgBox.innerHTML += `<small class="text-secondary"> << ${msg} >> </small><br>`
  scrollToBottom(msgBox.parentElement)
})
socket.on('leave-room', msg => {
  msgBox.innerHTML += `<small class="text-secondary"> << ${msg} >> </small><br>`
  scrollToBottom(msgBox.parentElement)
})
socket.on('connected-users', room => {
  roomName.innerText = 'Room: '+room.roomName
  hostName.innerText = 'Host: '+room.hostName
  usersBox.innerHTML = ''
  room.users.forEach(user => {
    if (user.socketId != socket.id) {
      usersBox.innerHTML += `<span class="m-2 user">${user.username}</span> | `
    }
  })
})
socket.on('get-msg', msg => {
  msgBox.innerHTML += `<p class="msg msg-user">${msg}</p>`
  scrollToBottom(msgBox.parentElement)
})
socket.on('illegal-join', () => {
  alert("failed to join room, failed hints\n1-room doesn't exist\n2-host reload the page\n3-duplicate usernames")
  location.href = '/'
})
socket.on('room-closed', () => {
  alert('Host closed the room!')
  location.href = '/'
})

function sendMsg(event) {
  event.preventDefault()
  const msgInput = event.target.firstElementChild
  msgBox.innerHTML += `<p class="msg msg-local">You: ${msgInput.value}</p>`
  socket.emit('send-msg', {username: localStorage.getItem('username'), msg: msgInput.value, roomId: slug})
  msgInput.value = ''
  scrollToBottom(msgBox.parentElement)
}

// Event Listener
msgForm.addEventListener('submit', sendMsg)