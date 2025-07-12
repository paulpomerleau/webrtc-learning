// === UI & DOM MANIPULATION ===

// DOM elements
const connectionStatus = document.getElementById('connectionStatus')
const chatMessages = document.getElementById('chatMessages')

export function updateConnectionStatus(status) {
    connectionStatus.textContent = status
    connectionStatus.className = `connection-status ${getStatusClass(status)}`
}

function getStatusClass(status) {
    if (status.includes('Connected') || status.includes('verified')) return 'connected'
    if (status.includes('Connecting') || status.includes('Joining')) return 'connecting'
    if (status.includes('error')) return 'error'
    return 'disconnected'
}

export function addMessage(sender, message, isOwn = false) {
    const div = document.createElement('div')
    div.className = `message ${isOwn ? 'own' : sender === 'System' ? 'system' : ''}`
    
    if (sender === 'System') {
        div.textContent = message
    } else {
        const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        div.innerHTML = `
            <div class="message-header">${sender}</div>
            <div class="message-text">${message}</div>
            <div class="message-time">${time}</div>
        `
    }
    
    chatMessages.appendChild(div)
    chatMessages.scrollTop = chatMessages.scrollHeight
} 