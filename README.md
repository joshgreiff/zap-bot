# ⚡ Zap Bot - Next.js Edition

**Stream wheel zap automation for Jerry Loves Freedom**

A robust, modern web application built with Next.js that automates Bitcoin Lightning zaps for stream wheel winners. Features a beautiful spinning wheel, real-time participant management, and seamless Speed API integration.

## ✨ Features

### 🎡 **Visual Spinning Wheel**
- Beautiful, animated wheel with realistic physics
- Real-time participant display
- Smooth animations and winner announcements

### 👥 **Participant Management**
- Simple check-in process for viewers
- Real-time participant tracking
- Admin panel for stream management

### ⚡ **Lightning Integration**
- Speed API integration for instant zaps
- Simulation mode for testing
- Automatic zap sending to winners

### 🚀 **Modern Architecture**
- Built with Next.js 15 and TypeScript
- Tailwind CSS for beautiful UI
- Serverless-ready for Vercel deployment
- Real-time updates without Socket.IO complexity

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **API**: Speed Lightning API
- **State**: React hooks with real-time polling

## 🚀 Quick Start

### Development

1. **Clone and install**
   ```bash
   git clone <repository>
   cd zap-bot-nextjs
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Add your Speed API key (optional for demo mode)
   SPEED_API_KEY=your_speed_api_key_here
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

### Deployment to Vercel

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set environment variables in Vercel dashboard**
   - `SPEED_API_KEY` (optional - runs in simulation mode without it)
   - `DATABASE_URL` (recommended - persists streams, participants, and payouts)

3. **Deploy**
   ```bash
   git push origin main
   ```

## 📱 Usage Flow

### For Jerry (Streamer)

1. **Create Stream**
   - Visit the homepage
   - Enter stream name
   - Get three links: Check-in, Admin, Wheel

2. **Share Check-in Link**
   - Share with viewers during stream
   - Participants enter name + Speed address

3. **Use Admin Panel**
   - View all participants
   - Select winner manually
   - Send zaps instantly

4. **Display Wheel**
   - Share wheel page on stream
   - Visual spinning wheel for viewers
   - Automatic winner announcements

### For Viewers

1. **Check In**
   - Click shared link
   - Enter name and Speed address
   - Join the wheel automatically

2. **Watch Stream**
   - See spinning wheel on stream
   - Get instant zap notifications when winning

## 🔧 API Endpoints

### Streams
- `GET /api/streams` - List active streams
- `POST /api/streams` - Create new stream
- `GET /api/streams/[id]` - Get stream details
- `DELETE /api/streams/[id]` - End stream

### Participants
- `POST /api/streams/[id]/checkin` - Check in participant
- `GET /api/streams/[id]/export` - Download participant addresses as CSV

### Zaps
- `POST /api/streams/[id]/spin` - Select winner and send zap

### System
- `GET /api/status` - API status and balance

## 🎨 Pages

- `/` - Home page (create/manage streams)
- `/checkin/[id]` - Participant check-in
- `/admin/[id]` - Stream admin panel
- `/wheel/[id]` - Visual spinning wheel

## 🔒 Environment Variables

```env
# Speed API (optional - runs in simulation mode without)
SPEED_API_KEY=your_speed_api_key
SPEED_API_URL=https://api.tryspeed.com

# Persistent storage (recommended for production)
DATABASE_URL=postgres://user:password@host:5432/database

# Next.js (auto-detected)
NODE_ENV=production
```

## 🏗 Architecture

### Serverless-First Design
- Next.js API routes handle all backend logic
- Postgres-backed store when `DATABASE_URL` is configured
- In-memory fallback for local demo/testing without a database
- Automatic scaling on Vercel

### Real-Time Updates
- Polling-based real-time updates
- No WebSocket complexity
- Works perfectly in serverless environment

### Mobile-Responsive
- Tailwind CSS responsive design
- Works on all devices
- Touch-friendly interface

## 🎯 Key Improvements Over Express Version

✅ **Robust Architecture** - Next.js handles serverless much better
✅ **Beautiful UI** - Modern Tailwind design
✅ **TypeScript** - Full type safety
✅ **Better Performance** - Optimized builds and caching
✅ **Easier Deployment** - Zero-config Vercel deployment
✅ **Mobile Friendly** - Responsive design
✅ **Real Spinning Wheel** - Actual animated canvas wheel

## 🐛 Troubleshooting

### Stream Not Found Errors
- Fixed with serverless-resilient architecture
- Streams auto-create when accessed
- No more intermittent failures

### Wheel Not Displaying Names
- Canvas-based wheel shows all participants
- Real-time updates every few seconds
- Beautiful animations and colors

### Inconsistent Behavior
- Eliminated with proper Next.js architecture
- Predictable serverless execution
- Comprehensive error handling

## 💡 Development

### Adding Features
1. API routes go in `src/app/api/`
2. Pages go in `src/app/[route]/`
3. Components go in `src/components/`
4. Utilities go in `src/lib/`

### Testing
```bash
npm run build  # Test production build
npm run lint   # Check code quality
```

## 🤝 Contributing

This is a custom project for Jerry Loves Freedom. For improvements or issues, contact Josh Greiff.

## 📄 License

MIT License - Built with ❤️ for the Bitcoin community

---

**Ready to automate your stream zaps? Deploy to Vercel in 2 minutes! 🚀**
