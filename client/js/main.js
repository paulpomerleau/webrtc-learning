// === MAIN APPLICATION COORDINATOR ===

import { generateKeyPair, verifyMessage, generateMessageHash, importPublicKey } from './crypto.js'
import { initializeWebRTC, joinRoom, toggleMute, toggleVideo } from './webrtc.js'
import { startNewSession, setPeerInfo, setPeerPublicKey, sendChatMessage, exportSession } from './session.js'
import { updateConnectionStatus } from './ui.js'

// DOM elements
const roomInput = document.getElementById('roomInput')
const joinBtn = document.getElementById('joinBtn')
const muteBtn = document.getElementById('muteBtn')
const videoBtn = document.getElementById('videoBtn')
const downloadBtn = document.getElementById('downloadBtn')
const verifyBtn = document.getElementById('verifyBtn')
const uploadBtn = document.getElementById('uploadBtn')
const chatInput = document.getElementById('chatInput')
const sendBtn = document.getElementById('sendBtn')

// Initialize application
document.addEventListener('DOMContentLoaded', init)

async function init() {
    // Initialize all modules
    await generateKeyPair()
    initializeWebRTC()
    
    setupEventListeners()
    updateConnectionStatus('Ready to join room')
}

function setupEventListeners() {
    // UI event listeners
    joinBtn.addEventListener('click', handleJoinRoom)
    muteBtn.addEventListener('click', toggleMute)
    videoBtn.addEventListener('click', toggleVideo)
    downloadBtn.addEventListener('click', exportSession)
    verifyBtn.addEventListener('click', () => uploadBtn.click())
    uploadBtn.addEventListener('change', handleFileUpload)
    sendBtn.addEventListener('click', () => sendChatMessage())
    chatInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') sendChatMessage()
    })
}

async function handleJoinRoom() {
    const roomId = roomInput.value.trim()
    if (!roomId) return
    
    // Disable join button
    joinBtn.disabled = true
    
    // Start new session
    startNewSession(roomId)
    
    // Enable chat controls
    chatInput.disabled = sendBtn.disabled = false
    
    // Join room via WebRTC with proper callbacks
    await joinRoom(roomId, {
        onPeerConnected: handlePeerConnected,
        onKeyExchange: handleKeyExchange,
        onSessionEnd: () => {} // Empty callback since we removed endSession
    })
}

async function handleFileUpload(event) {
    const file = event.target.files[0]
    if (!file) return
    
    try {
        const text = await file.text()
        const transcriptData = JSON.parse(text)
        
        await verifyTranscript(transcriptData)
    } catch (err) {
        alert(`❌ Invalid file format: ${err.message}`)
    }
    
    // Reset file input
    event.target.value = ''
}

async function verifyTranscript(data) {
    try {
        // Check basic structure
        if (!data.session || !data.session.signature || !data.session.hash) {
            alert('❌ Invalid transcript format - missing signature or hash')
            return
        }
        
        const session = data.session
        const { signature, hash, messages } = session
        
        // Use the messages directly since we now sign the actual ID format
        const sessionData = JSON.stringify(messages)
        
        // Verify hash
        const computedHash = await generateMessageHash(sessionData)
        const hashValid = hash === computedHash
        
        if (!hashValid) {
            alert('❌ Hash verification failed - transcript may be tampered')
            return
        }
        
        // Verify signature by trying both public keys
        let signatureValid = false
        
        if (session.publicKeys) {
            const { local, peer } = session.publicKeys
            
            // Try local key first
            if (local) {
                try {
                    const publicKey = await importPublicKey(local)
                    signatureValid = await verifyMessage(sessionData, signature, publicKey)
                } catch (err) {
                    // Silent fail, try peer key
                }
            }
            
            // Try peer key if local didn't work
            if (!signatureValid && peer) {
                try {
                    const publicKey = await importPublicKey(peer)
                    signatureValid = await verifyMessage(sessionData, signature, publicKey)
                } catch (err) {
                    // Silent fail
                }
            }
        }
        
        // Display results in alert
        const results = [
            `📊 Transcript: ${session.messageCount} messages`,
            `🏠 Room: ${session.room}`,
            `📅 Date: ${new Date(session.started).toLocaleDateString()}`,
            `🔐 Hash: ${hashValid ? '✅ Valid' : '❌ Invalid'}`,
            `✍️ Signature: ${signatureValid ? '✅ Valid' : '❌ Invalid'}`
        ]
        
        if (hashValid && signatureValid) {
            alert('🎉 Transcript verification successful!\n\n' + results.join('\n'))
        } else {
            alert('⚠️ Transcript verification failed\n\n' + results.join('\n'))
        }
        
    } catch (err) {
        alert(`❌ Verification error: ${err.message}`)
    }
}

function handlePeerConnected(userId) {
    // Store peer info in session
    setPeerInfo(userId)
}

function handleKeyExchange(publicKey) {
    // Store peer public key in session
    setPeerPublicKey(publicKey)
} 