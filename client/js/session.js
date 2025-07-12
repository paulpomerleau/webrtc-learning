// === SESSION & MESSAGE MANAGEMENT ===

import { signMessage, generateMessageHash, exportPublicKey } from './crypto.js'
import { addMessage } from './ui.js'
import { sendMessage as sendToWebRTC, isConnected, getSocketId } from './webrtc.js'

let currentSession = null
let sessionMessages = []
let messageQueue = []

export function startNewSession(roomId) {
    sessionMessages = []
    messageQueue = []
    currentSession = {
        id: crypto.randomUUID(),
        room: roomId,
        started: new Date().toISOString(),
        peer: null
    }
}

export function setPeerInfo(userId) {
    if (currentSession) {
        currentSession.peer = {
            id: userId,
            connected: new Date().toISOString()
        }
    }
}

export function setPeerPublicKey(publicKey) {
    if (currentSession && currentSession.peer) {
        currentSession.peer.publicKey = publicKey
    }
}

export async function sendChatMessage(messageText = null) {
    const chatInput = document.getElementById('chatInput')
    const message = messageText || chatInput.value.trim()
    if (!message) return
    
    if (isConnected()) {
        const socketId = getSocketId()
        
        const messageData = {
            type: 'chat',
            message,
            timestamp: Date.now(),
            sender: 'local',
            senderId: socketId || currentSession?.id || 'unknown'
        }
        
        const sent = sendToWebRTC(messageData)
        if (sent) {
            sessionMessages.push(messageData)
            addMessage('You', message, true)
            
            if (!messageText) chatInput.value = ''
        }
    } else {
        messageQueue.push(message)
        addMessage('You', message + ' (queued)', true)
        if (!messageText) chatInput.value = ''
    }
}

export async function sendQueuedMessages() {
    while (messageQueue.length > 0) {
        const queuedMessage = messageQueue.shift()
        await sendChatMessage(queuedMessage)
    }
}

export function handleChatMessage(messageData) {
    // Store peer messages with correct sender field, keep their actual senderId
    const peerMessage = {
        ...messageData,
        sender: 'peer'
    }
    sessionMessages.push(peerMessage)
    addMessage('Peer', messageData.message, false)
}

export async function exportSession() {
    if (!currentSession || sessionMessages.length === 0) {
        addMessage('System', 'No session to export')
        return
    }
    
    // Get both public keys for signature verification
    const ourPublicKey = await exportPublicKey()
    
    // Create the final message format that will be signed
    const finalMessages = sessionMessages.map(msg => {
        const socketId = getSocketId()
        const finalSender = msg.senderId || (msg.sender === 'local' ? socketId : currentSession?.peer?.id) || 'unknown'
        
        return {
            sender: finalSender,
            message: msg.message,
            timestamp: msg.timestamp
        }
    })
    
    // Sign the actual final message format
    const sessionData = JSON.stringify(finalMessages)
    const sessionSignature = await signMessage(sessionData)
    const sessionHash = await generateMessageHash(sessionData)
    
    const exportData = {
        version: '2.0',
        exported: new Date().toISOString(),
        session: {
            ...currentSession,
            messageCount: finalMessages.length,
            messages: finalMessages,
            signature: sessionSignature,
            hash: sessionHash,
            verified: true,
            publicKeys: {
                local: ourPublicKey,
                peer: currentSession.peer?.publicKey || null
            },
            metadata: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                clientTime: Date.now()
            }
        }
    }
    
    const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(jsonBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `webrtc-session-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    addMessage('System', 'Session exported')
} 