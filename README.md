# Simple WebRTC Demo

The simplest possible WebRTC demo. Two folders, minimal code, maximum learning.

## What you get

```
webrtc-learning/
├── server/          # 30 lines of Node.js + Socket.IO  
└── client/          # 1 HTML file with simple-peer
```

## Run it

```bash
# Install server dependencies
cd server
npm install

# Start server
npm start
```

Then open **two browser windows** to `http://localhost:3000`

## How it works

1. **Server**: Basic signaling server (forwards messages between peers)
2. **Client**: One HTML file with simple-peer doing all the WebRTC magic
3. **Join same room** in both windows → automatic video call

## The magic

- **Server**: 30 lines of Express + Socket.IO
- **Client**: 150 lines of HTML + simple-peer
- **Total**: Under 200 lines for complete WebRTC app

No TypeScript, no build steps, no complexity. Just WebRTC learning.