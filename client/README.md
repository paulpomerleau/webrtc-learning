# WebRTC Chat Application - Clean Modular Structure

This WebRTC chat application is organized into lean, focused ES6 modules with cryptographic verification capabilities.

## 📁 File Structure

```
/client
├── index.html           # Main HTML file
├── style.css           # Styling
├── js/
│   ├── main.js         # Application coordinator & initialization
│   ├── crypto.js       # Cryptographic functions (signing, verification, hashing)
│   ├── webrtc.js       # WebRTC connection management
│   ├── session.js      # Session & message management
│   └── ui.js           # DOM manipulation & UI updates
└── README.md
```

## 🧩 Module Responsibilities

### `main.js` - Application Coordinator (135 lines)
- Initializes all modules
- Handles UI event listeners
- Coordinates between modules via callbacks
- **Transcript verification** - Upload and verify exported sessions
- Entry point for the application

### `crypto.js` - Cryptographic Functions (100 lines)
- Key pair generation (ECDSA P-256)
- Message signing for session integrity
- **Message verification** for uploaded transcripts
- Hash generation and verification
- Public key import/export for peer verification

### `webrtc.js` - WebRTC Management (120 lines)
- Peer connection setup with SimplePeer
- Socket.IO signaling coordination
- Media stream handling (video/audio)
- Connection state management and callbacks

### `session.js` - Session & Messages (105 lines)
- Session lifecycle management
- Message queuing and sending
- Session export with cryptographic signatures
- Chat message handling

### `ui.js` - User Interface (35 lines)
- Connection status updates with color coding
- Message display in chat area
- DOM element manipulation

## 🔧 Key Features

- **Session-based signatures** - One signature per complete conversation
- **Peer identity verification** - Cryptographic public key exchange
- **Transcript verification** - Upload and verify exported sessions (🔍 button)
- **Clean architecture** - Each module has single responsibility
- **ES6 modules** - Modern JavaScript with explicit imports/exports
- **Export functionality** - Download signed conversation transcripts

## 🚀 Usage

1. Open `index.html` in a modern browser
2. Enter room ID and join
3. Chat with peers (messages are cryptographically signed)
4. **Export session** for verification and audit trails (📥 button)
5. **Verify transcripts** by uploading JSON files (🔍 button)

## 🔐 Security Features

- **ECDSA P-256** signatures for message authentication
- **Non-repudiation** - Signed sessions can't be denied
- **Peer verification** - Public key exchange for identity verification
- **Session integrity** - Complete conversation signing with hash verification
- **Transcript validation** - Verify authenticity of exported conversations 