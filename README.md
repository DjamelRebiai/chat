# ChatFlow - Full-Stack Real-Time Chat Application

A professional, production-ready chat application with real-time messaging, voice/video calls, and media sharing capabilities.

## Features

✅ **Real-time Messaging** - Instant message delivery via Socket.io  
✅ **Voice & Video Calls** - WebRTC peer-to-peer calls  
✅ **Media Sharing** - Images, videos, and files via Cloudinary  
✅ **User Authentication** - Secure JWT-based auth with bcrypt passwords  
✅ **Dark/Light Mode** - Theme support  
✅ **Online Status** - Real-time user status tracking  
✅ **n8n Integration** - Webhook support for automation  

## Tech Stack

### Frontend
- Next.js 16 with React 19
- Tailwind CSS v4
- Socket.io Client
- Shadcn UI Components

### Backend
- Node.js with Express
- Socket.io for real-time communication
- Neon PostgreSQL database
- Cloudinary for media storage
- WebRTC for voice/video calls

### Infrastructure
- JWT Authentication
- Bcrypt password hashing
- CORS-enabled API
- Environment-based configuration

## Project Structure

\`\`\`
chatflow/
├── frontend/
│   ├── app/
│   │   ├── page.tsx (Landing)
│   │   ├── login/
│   │   ├── signup/
│   │   └── chat/
│   ├── components/
│   │   ├── chat-layout.tsx
│   │   ├── sidebar.tsx
│   │   ├── chat-window.tsx
│   │   ├── message-list.tsx
│   │   ├── top-bar.tsx
│   │   └── video-call-modal.tsx
│   ├── lib/
│   ├── styles/
│   └── package.json
├── backend/
│   ├── server.js (Main server file)
│   ├── init.sql (Database schema)
│   ├── package.json
│   └── .env.example
└── README.md
\`\`\`

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (or Neon account)
- Cloudinary account
- npm or yarn

### Frontend Setup

1. **Clone and navigate:**
   \`\`\`bash
   cd frontend
   npm install
   \`\`\`

2. **Create `.env.local`:**
   \`\`\`
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   \`\`\`

3. **Run development server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   Open [http://localhost:3000](http://localhost:3000)

### Backend Setup

1. **Navigate and install:**
   \`\`\`bash
   cd backend
   npm install
   \`\`\`

2. **Create `.env`:**
   \`\`\`
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   DATABASE_URL=postgresql://user:password@host:5432/chatflow
   JWT_SECRET=your_super_secret_key
   CLOUDINARY_NAME=your_name
   CLOUDINARY_API_KEY=your_key
   CLOUDINARY_API_SECRET=your_secret
   \`\`\`

3. **Initialize database:**
   \`\`\`bash
   # Using psql or your DB client, run init.sql
   psql -U user -d chatflow -f init.sql
   \`\`\`

4. **Start server:**
   \`\`\`bash
   npm start
   # or for development with auto-reload:
   npm run dev
   \`\`\`

## Environment Variables

### Frontend (.env.local)
\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
\`\`\`

### Backend (.env)
\`\`\`
PORT=5000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@host:5432/chatflow
JWT_SECRET=your_jwt_secret_key_here
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/chat-events (optional)
\`\`\`

## Deployment

### Frontend - Vercel

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy (automatic on push)

### Backend - Railway/Render

#### Railway
1. Connect GitHub repo
2. Add environment variables
3. Select Node.js environment
4. Auto-deploy on git push

#### Render
1. Create new Web Service
2. Connect GitHub repo
3. Set build: `npm install`
4. Set start: `npm start`
5. Add environment variables

#### Heroku
1. Install Heroku CLI
2. `heroku create your-app`
3. `heroku config:set VAR_NAME=value`
4. `git push heroku main`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/search?query=` - Search users

### Upload
- `POST /api/upload` - Upload media file

## Socket.io Events

### Client → Server
- `get_conversations` - Fetch user's conversations
- `create_conversation` - Start new conversation
- `get_messages` - Load conversation messages
- `send_message` - Send message
- `initiate_call` - Start voice/video call
- `end_call` - End call
- `webrtc_*` - WebRTC signaling events

### Server → Client
- `conversation_list` - List of conversations
- `new_message` - New message received
- `incoming_call` - Incoming call notification
- `call_ended` - Call ended notification

## n8n Integration

Send webhook events to n8n for automation:

**Webhook Events:**
- `message_sent` - When user sends message
- `call_initiated` - When call starts
- `call_ended` - When call ends
- `user_joined` - When user joins

**Example Payload:**
\`\`\`json
{
  "event": "message_sent",
  "data": {
    "userId": 1,
    "conversationId": "1_2",
    "messageType": "text"
  },
  "timestamp": "2024-11-01T10:30:00Z"
}
\`\`\`

## Troubleshooting

### WebSocket Connection Failed
- Ensure backend is running
- Check `NEXT_PUBLIC_SOCKET_URL` is correct
- Verify CORS settings in backend
- Check firewall settings

### Cloudinary Upload Fails
- Verify credentials in `.env`
- Check file size limits
- Ensure file format is supported

### Video Call Issues
- Check browser permissions for camera/microphone
- Verify WebRTC connection with STUN servers
- Check network connectivity
- Browser console for detailed errors

## License

MIT - Feel free to use this for your projects!

## Support

For issues and questions:
1. Check troubleshooting section
2. Review Socket.io documentation
3. Check Cloudinary docs for media issues
4. Consult WebRTC guides for call problems
