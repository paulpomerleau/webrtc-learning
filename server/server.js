const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const path = require('path')

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')))

const rooms = new Map()

io.on('connection', (socket) => {
    console.log('User connected:', socket.id)
    
    socket.on('join-room', (roomId) => {
        socket.join(roomId)
        
        // Track users in room
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set())
        }
        rooms.get(roomId).add(socket.id)
        
        // Notify others in room
        socket.to(roomId).emit('user-joined', socket.id)
        
        console.log(`User ${socket.id} joined room ${roomId}`)
        console.log(`Room ${roomId} now has ${rooms.get(roomId).size} users`)
    })
    
    socket.on('signal', (data) => {
        console.log(`Forwarding signal from ${socket.id} to room ${data.room}`)
        socket.to(data.room).emit('signal', {
            signal: data.signal,
            userId: socket.id
        })
    })
    
    socket.on('chat-message', (data) => {
        console.log(`📨 Chat message received from ${socket.id}:`, data)
        console.log(`📤 Forwarding to room ${data.room}`)
        socket.to(data.room).emit('chat-message', {
            message: data.message,
            userId: socket.id
        })
    })
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
        // Clean up rooms
        rooms.forEach((users, roomId) => {
            users.delete(socket.id)
            if (users.size === 0) {
                rooms.delete(roomId)
            }
        })
    })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Open http://localhost:${PORT} in two browser windows`)
}) 