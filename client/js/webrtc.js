// === WEBRTC CONNECTION MANAGEMENT ===

import { exportPublicKey, importPublicKey } from './crypto.js'
import { updateConnectionStatus } from './ui.js'
import { handleChatMessage, sendQueuedMessages } from './session.js'

const socket = io()
let peer = null
let localStream = null
let peerPublicKey = null
let currentRoom = null
let callbacks = {}

// DOM elements
const remoteVideo = document.getElementById('remoteVideo')
const localVideo = document.getElementById('localVideo')
const muteBtn = document.getElementById('muteBtn')
const videoBtn = document.getElementById('videoBtn')
const noVideoMessage = document.getElementById('noVideoMessage')

export function initializeWebRTC() {
    socket.on('user-joined', handleUserJoined)
    socket.on('signal', handleSignal)
}

export async function joinRoom(roomId, roomCallbacks) {
    currentRoom = roomId
    callbacks = roomCallbacks || {}
    
    updateConnectionStatus('Joining room...')
    
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        localVideo.srcObject = localStream
        updateConnectionStatus('Video mode enabled')
    } catch (err) {
        updateConnectionStatus('Chat-only mode')
        noVideoMessage.style.display = 'block'
        muteBtn.style.display = videoBtn.style.display = localVideo.style.display = 'none'
    }
    
    updateConnectionStatus('Waiting for peer...')
    socket.emit('join-room', roomId)
}

function handleUserJoined(userId) {
    updateConnectionStatus('Connecting to peer...')
    
    // Notify main app about peer via callback
    if (callbacks.onPeerConnected) {
        callbacks.onPeerConnected(userId)
    }
    
    createPeer(true)
}

function createPeer(isInitiator) {
    peer = new SimplePeer({
        initiator: isInitiator,
        trickle: false,
        stream: localStream || undefined
    })
    
    peer.on('signal', data => {
        socket.emit('signal', { signal: data, room: currentRoom })
    })
    
    peer.on('stream', stream => {
        remoteVideo.srcObject = stream
        muteBtn.disabled = videoBtn.disabled = false
        updateConnectionStatus('Video connected')
    })
    
    peer.on('connect', async () => {
        updateConnectionStatus('Connected & encrypted')
        
        const publicKey = await exportPublicKey()
        if (publicKey) {
            peer.send(JSON.stringify({ type: 'key-exchange', publicKey }))
        }
        
        // Send queued messages
        await sendQueuedMessages()
    })
    
    peer.on('data', async data => {
        const message = JSON.parse(data.toString())
        
        if (message.type === 'key-exchange') {
            peerPublicKey = await importPublicKey(message.publicKey)
            updateConnectionStatus('Connected & verified')
            
            // Notify main app about key exchange via callback
            if (callbacks.onKeyExchange) {
                callbacks.onKeyExchange(message.publicKey)
            }
        } else if (message.type === 'chat') {
            handleChatMessage(message)
        }
    })
    
    peer.on('error', err => {
        console.error('Peer error:', err)
        updateConnectionStatus('Connection error')
    })
    
    peer.on('close', () => {
        if (callbacks.onSessionEnd) {
            callbacks.onSessionEnd()
        }
    })
}

function handleSignal(data) {
    if (!peer) createPeer(false)
    peer.signal(data.signal)
}

export function sendMessage(messageData) {
    if (peer && peer.connected) {
        peer.send(JSON.stringify(messageData))
        return true
    }
    return false
}

export function toggleMute() {
    if (!localStream) return
    const tracks = localStream.getAudioTracks()
    if (tracks.length === 0) return
    
    tracks.forEach(track => track.enabled = !track.enabled)
    muteBtn.textContent = tracks[0].enabled ? 'Mute' : 'Unmute'
}

export function toggleVideo() {
    if (!localStream) return
    const tracks = localStream.getVideoTracks()
    if (tracks.length === 0) return
    
    tracks.forEach(track => track.enabled = !track.enabled)
    videoBtn.textContent = tracks[0].enabled ? 'Video Off' : 'Video On'
}

export function isConnected() {
    return peer && peer.connected
}

export function getSocketId() {
    return socket.id
} 