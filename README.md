# Family Sync

A modern family coordination platform built with Next.js and Node.js that helps families stay organized with shared events, tasks, messaging, and RSVP management.

## Features

- 👥 **Family Groups & Events**: Create and manage family groups with shared events
- ✅ **Task Management**: Assign and track tasks within groups and events
- 💬 **Real-time Chat**: Live messaging with Socket.IO integration
- 🎫 **RSVP System**: Manage event attendance and responses
- 📱 **Cross-device Support**: Works seamlessly across all devices
- 🔐 **Secure Authentication**: JWT-based auth with refresh tokens
- 📁 **File Upload**: Profile pictures and media sharing with AWS S3

## Tech Stack

### Frontend

- **Next.js 14** - React framework with app router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - Real-time communication
- **Lucide React** - Beautiful icons

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Document database with Mongoose ODM
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - JSON Web Token authentication
- **AWS S3** - File storage and uploads

## Quick Start

### Prerequisites

- Node.js 18+ (recommend using nvm)
- MongoDB database (local or MongoDB Atlas)
- AWS S3 bucket (for file uploads)

### 1. Clone the Repository

```bash
git clone https://github.com/fperezfrancisco/family-sync.git
cd family-sync
```

### 2. Setup Backend Server

```bash
cd services/backend-server
npm install
```

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```properties
# Database
MONGO_URI=mongodb://localhost:27017/family-sync

# JWT Secrets (generate strong random strings)
JWT_ACCESS_SECRET=your-strong-access-secret
JWT_REFRESH_SECRET=your-strong-refresh-secret

# AWS S3 Configuration
BUCKET_NAME=your-s3-bucket-name
BUCKET_REGION=us-east-1
BUCKET_ACCESS_KEY=your-aws-access-key
BUCKET_SECRET_ACCESS_KEY=your-aws-secret-key

# See .env.example for all available options
```

Start the backend server:

```bash
npm run dev
```

The API will be available at `http://localhost:4000`

### 3. Setup Frontend Client

```bash
cd client
npm install
```

Copy the example environment file and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```properties
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_IO_URL=http://localhost:4000
```

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Environment Configuration

### Client Environment Variables

| Variable                    | Description          | Default                 |
| --------------------------- | -------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL`       | Backend API endpoint | `http://localhost:4000` |
| `NEXT_PUBLIC_SOCKET_IO_URL` | Socket.IO server URL | `http://localhost:4000` |

### Server Environment Variables

| Variable                   | Description                    | Required     |
| -------------------------- | ------------------------------ | ------------ |
| `PORT`                     | Server port                    | No (4000)    |
| `MONGO_URI`                | MongoDB connection string      | Yes          |
| `JWT_ACCESS_SECRET`        | JWT access token secret        | Yes          |
| `JWT_REFRESH_SECRET`       | JWT refresh token secret       | Yes          |
| `ACCESS_TOKEN_TTL`         | Access token expiry (seconds)  | No (900)     |
| `REFRESH_TOKEN_TTL`        | Refresh token expiry (seconds) | No (2592000) |
| `SOCKET_IO_CORS_ORIGIN`    | Frontend URL for CORS          | No           |
| `BUCKET_NAME`              | AWS S3 bucket name             | Yes          |
| `BUCKET_REGION`            | AWS S3 region                  | Yes          |
| `BUCKET_ACCESS_KEY`        | AWS access key ID              | Yes          |
| `BUCKET_SECRET_ACCESS_KEY` | AWS secret access key          | Yes          |

## Cross-Device Development

To test the application across multiple devices on your local network:

1. Find your machine's IP address:

   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # Windows
   ipconfig
   ```

2. Update your client `.env.local`:

   ```properties
   NEXT_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:4000
   NEXT_PUBLIC_SOCKET_IO_URL=http://YOUR_IP_ADDRESS:4000
   ```

3. Make sure your backend allows connections from your network IP in CORS settings.

## Project Structure

```
family-sync/
├── client/                 # Next.js frontend application
│   ├── app/               # App router pages
│   ├── components/        # Reusable React components
│   ├── context/          # React context providers
│   ├── lib/              # Utility functions and API client
│   ├── types/            # TypeScript type definitions
│   └── .env.example      # Example environment file
├── services/
│   └── backend-server/   # Express.js backend API
│       ├── src/
│       │   ├── routes/   # API route handlers
│       │   ├── models/   # MongoDB models
│       │   ├── lib/      # Utility functions
│       │   ├── services/ # Business logic
│       │   └── utils/    # Helper utilities
│       └── .env.example  # Example environment file
└── README.md
```

## Development Scripts

### Frontend (client/)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Backend (services/backend-server/)

- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## Key Features Explained

### Real-time Messaging

The chat system uses Socket.IO for real-time bidirectional communication. Messages are persisted to MongoDB and automatically cleaned up after 30 days.

### RSVP System

Users can respond to events with Going/Not Going/Maybe status. The system tracks attendance and provides real-time updates.

### Task Management

Create tasks within groups or for specific events. Tasks can be assigned to specific users or left open for self-assignment.

### Cross-device Synchronization

All features work seamlessly across different devices and browsers through real-time updates.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security Notes

- Never commit actual credentials to version control
- Use strong, random secrets for JWT tokens
- Enable HTTPS in production
- Configure proper CORS origins
- Regularly rotate API keys and secrets
- Use environment-specific configurations

## Deployment

### Backend Deployment

- Set `NODE_ENV=production`
- Use a managed MongoDB service (MongoDB Atlas)
- Configure proper CORS origins
- Set up SSL/TLS certificates
- Use PM2 or similar for process management

### Frontend Deployment

- Build the application (`npm run build`)
- Deploy to Vercel, Netlify, or similar
- Configure environment variables in deployment platform
- Set up proper domain and SSL

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
