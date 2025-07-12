// === CRYPTOGRAPHIC FUNCTIONS ===

let keyPair = null

export async function generateKeyPair() {
    try {
        keyPair = await crypto.subtle.generateKey(
            { name: 'ECDSA', namedCurve: 'P-256' },
            true,
            ['sign', 'verify']
        )
        return keyPair
    } catch (err) {
        console.error('Key generation failed:', err)
        return null
    }
}

export async function signMessage(message) {
    if (!keyPair) return null
    
    try {
        const data = new TextEncoder().encode(message)
        const signature = await crypto.subtle.sign(
            { name: 'ECDSA', hash: 'SHA-256' },
            keyPair.privateKey,
            data
        )
        return arrayBufferToBase64(signature)
    } catch (err) {
        console.error('Message signing failed:', err)
        return null
    }
}

export async function exportPublicKey() {
    if (!keyPair) return null
    
    try {
        return await crypto.subtle.exportKey('jwk', keyPair.publicKey)
    } catch (err) {
        console.error('Public key export failed:', err)
        return null
    }
}

export async function importPublicKey(jwkKey) {
    try {
        return await crypto.subtle.importKey(
            'jwk',
            jwkKey,
            { name: 'ECDSA', namedCurve: 'P-256' },
            false,
            ['verify']
        )
    } catch (err) {
        console.error('Public key import failed:', err)
        return null
    }
}

export async function verifyMessage(message, signature, publicKey) {
    if (!publicKey || !signature) return false
    
    try {
        const data = new TextEncoder().encode(message)
        const sigArray = base64ToArrayBuffer(signature)
        
        return await crypto.subtle.verify(
            { name: 'ECDSA', hash: 'SHA-256' },
            publicKey,
            sigArray,
            data
        )
    } catch (err) {
        console.error('Message verification failed:', err)
        return false
    }
}

export async function generateMessageHash(message) {
    const data = new TextEncoder().encode(message)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return arrayBufferToBase64(hashBuffer)
}

// === UTILITY FUNCTIONS ===

function arrayBufferToBase64(buffer) {
    const uint8Array = new Uint8Array(buffer)
    return btoa(String.fromCharCode(...uint8Array))
}

function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
} 