# Full-Stack Chat Application - Setup Guide

## Prerequisites

- Node.js 18+
- npm or pnpm
- A Neon PostgreSQL database
- Cloudinary account (for media uploads)
- n8n account (optional, for webhook integration)

## Frontend Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Configure environment variables in `.env.local`:
\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
\`\`\`

3. Run development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open http://localhost:3000 in your browser

## Backend Setup

1. Navigate to backend directory:
\`\`\`bash
cd backend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables in `.env`:
\`\`\`
NEON_DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
CLOUDINARY_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
\`\`\`

4. Initialize database schema:
\`\`\`bash
npm run init-db
# Or manually run the SQL from backend/init.sql in your Neon dashboard
\`\`\`

5. Run the server:
\`\`\`bash
npm start
\`\`\`

The backend will start on http://localhost:5000

## Features

### Text Messaging
- Real-time message delivery via Socket.io
- Message history persistence
- Timestamp tracking

### Media Support
- Image uploads and display
- Video support
- Voice message recording and playback
- File sharing with download links
- Automatic Cloudinary compression and optimization

### Voice & Video Calls
- Peer-to-peer WebRTC calls
- Call duration tracking
- Mute/unmute audio
- Toggle video on/off
- Multiple STUN servers for better connectivity

### User Management
- User authentication with JWT
- Email/password login
- User search functionality
- Online/offline status

### Integrations
- Cloudinary for media management
- n8n webhooks for event automation
- Webhook events: user_joined, message_sent, call_initiated, call_ended

## Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

### Backend (Railway/Render)
1. Create account on Railway or Render
2. Connect GitHub repository
3. Set environment variables
4. Deploy

## API Endpoints

### Authentication
- POST `/api/auth/signup` - Create new user
- POST `/api/auth/login` - Login user

### Users
- GET `/api/users/search?query=` - Search users

### Media
- POST `/api/upload` - Upload media file (authenticated)

## WebSocket Events

### Client → Server
- `get_conversations` - Fetch user conversations
- `create_conversation` - Start new conversation
- `get_messages` - Load message history
- `send_message` - Send new message
- `initiate_call` - Start video call
- `end_call` - End video call
- `webrtc_offer` - WebRTC offer
- `webrtc_answer` - WebRTC answer
- `webrtc_ice_candidate` - WebRTC ICE candidate

### Server → Client
- `conversation_list` - List of conversations
- `new_message` - New message received
- `incoming_call` - Incoming call notification
- `call_ended` - Call ended notification
- `webrtc_offer` - WebRTC offer received
- `webrtc_answer` - WebRTC answer received
- `webrtc_ice_candidate` - WebRTC ICE candidate received

## Troubleshooting

### WebSocket Connection Failed
- Verify backend is running
- Check CORS settings
- Ensure firewall allows port 5000

### Cloudinary Upload Issues
- Verify API credentials
- Check file size (max 100MB)
- Ensure file format is supported

### Call Connection Issues
- Check microphone/camera permissions
- Verify STUN servers are accessible
- Check browser console for detailed errors

## Support

For issues or questions, please create an issue in the repository.
