# Development Guide

This guide helps developers understand how to work with the Family Sync codebase effectively.

## Quick Start for Developers

### One-Command Setup

```bash
# Clone and setup everything
git clone https://github.com/fperezfrancisco/family-sync.git
cd family-sync
chmod +x setup.sh
./setup.sh
```

### Manual Setup

If you prefer to set things up manually, see the main [README.md](./README.md) for detailed instructions.

## Development Workflow

### Starting the Development Environment

1. **Start Backend Server** (Terminal 1):

   ```bash
   cd services/backend-server
   npm run dev
   ```

   - API will be available at `http://localhost:4000`
   - Hot reload enabled with nodemon

2. **Start Frontend Client** (Terminal 2):
   ```bash
   cd client
   npm run dev
   ```
   - App will be available at `http://localhost:3000`
   - Hot reload enabled with Next.js

### Environment Configuration

#### Required Configuration

Before starting development, you must configure:

1. **Backend `.env`**:

   ```properties
   MONGO_URI=mongodb://localhost:27017/family-sync
   JWT_ACCESS_SECRET=your-secret-here
   JWT_REFRESH_SECRET=your-other-secret-here
   BUCKET_NAME=your-s3-bucket
   BUCKET_ACCESS_KEY=your-aws-key
   BUCKET_SECRET_ACCESS_KEY=your-aws-secret
   ```

2. **Frontend `.env.local`**:
   ```properties
   NEXT_PUBLIC_API_URL=http://localhost:4000
   NEXT_PUBLIC_SOCKET_IO_URL=http://localhost:4000
   ```

#### Cross-Device Testing

To test on multiple devices (phones, tablets, other computers):

1. Find your machine's IP:

   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update frontend `.env.local`:

   ```properties
   NEXT_PUBLIC_API_URL=http://YOUR_IP:4000
   NEXT_PUBLIC_SOCKET_IO_URL=http://YOUR_IP:4000
   ```

3. Access the app from other devices: `http://YOUR_IP:3000`

## Code Style & Standards

### TypeScript

- Strict TypeScript configuration enabled
- All files should be `.ts` or `.tsx`
- Export types and interfaces from `types/` directory
- Use proper type annotations

### React/Next.js

- Use functional components with hooks
- Prefer App Router over Pages Router
- Use Server Components when possible
- Client Components only when necessary (interactivity, browser APIs)

### Backend

- Express.js with TypeScript
- Mongoose for MongoDB operations
- JWT for authentication
- Socket.IO for real-time features

### Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions/Variables**: camelCase (`getUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (`JWT_SECRET`)

## Project Architecture

### Frontend Structure

```
client/
├── app/                    # Next.js App Router
│   ├── (private)/         # Protected routes
│   ├── (public)/          # Public routes
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   └── [feature]/        # Feature-specific components
├── context/              # React Context providers
├── lib/                  # Utilities and API client
├── types/               # TypeScript definitions
└── hooks/               # Custom React hooks
```

### Backend Structure

```
services/backend-server/
├── src/
│   ├── routes/          # Express route handlers
│   ├── models/          # Mongoose schemas
│   ├── services/        # Business logic
│   ├── lib/            # Utilities (JWT, etc.)
│   ├── utils/          # Helper functions
│   └── index.ts        # Server entry point
└── dist/               # Compiled JavaScript (gitignored)
```

## Key Development Concepts

### Authentication Flow

1. User logs in → receives access token (15min) + refresh token (30 days)
2. Access token stored in memory, refresh token in httpOnly cookie
3. API requests include access token in Authorization header
4. Auto-refresh when access token expires

### Real-time Features

- Socket.IO handles chat, notifications, live updates
- Automatic reconnection on network issues
- Cross-device synchronization

### State Management

- React Context for global state (auth, socket)
- Local state with useState/useReducer for component state
- No external state management library currently

## Common Development Tasks

### Adding a New Feature

1. **Backend API**:

   ```bash
   cd services/backend-server/src/routes
   # Create new route file
   # Add to main router in index.ts
   ```

2. **Frontend Component**:

   ```bash
   cd client/components
   # Create component directory
   # Export from appropriate index file
   ```

3. **Types**:
   ```bash
   cd client/types
   # Add TypeScript interfaces
   ```

### Database Operations

```typescript
// models/User.ts
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

export default mongoose.model("User", userSchema);
```

### API Client Usage

```typescript
// Frontend API calls
import { api } from "@/lib/api";

const users = await api.get("/users");
const newUser = await api.post("/users", userData);
```

### Socket.IO Integration

```typescript
// Frontend - using Socket Context
const { socket } = useSocket();

socket?.emit("join-room", roomId);
socket?.on("message", handleMessage);
```

## Testing

### Running Tests

```bash
# Frontend
cd client
npm run test

# Backend
cd services/backend-server
npm run test
```

### Test Structure

- Unit tests for utilities and pure functions
- Integration tests for API endpoints
- Component tests for React components

## Debugging

### Backend Debugging

- Logs are output to console in development
- Use `console.log()` or proper logging library
- Check MongoDB connection and queries

### Frontend Debugging

- React DevTools for component inspection
- Network tab for API calls
- Console for JavaScript errors

### Common Issues

1. **CORS Errors**: Check `SOCKET_IO_CORS_ORIGIN` in backend
2. **Auth Issues**: Verify JWT secrets match between requests
3. **Socket Connection**: Ensure URLs match in client config
4. **File Upload**: Check AWS S3 credentials and bucket permissions

## Performance Considerations

### Frontend

- Use Next.js Image component for optimized images
- Implement proper loading states
- Lazy load components when appropriate

### Backend

- Database indexing for frequently queried fields
- Connection pooling for MongoDB
- Rate limiting for API endpoints (future enhancement)

## Security Best Practices

### Environment Variables

- Never commit actual secrets to git
- Use different secrets for development/production
- Rotate secrets regularly

### Authentication

- Short-lived access tokens (15 minutes)
- Secure httpOnly cookies for refresh tokens
- Proper CORS configuration

### Input Validation

- Validate all user inputs
- Sanitize data before database operations
- Use TypeScript for type safety

## Deployment

### Development Environment

- Use nodemon for backend auto-restart
- Use Next.js dev server for frontend hot reload
- Local MongoDB or MongoDB Atlas

### Production Considerations

- Set `NODE_ENV=production`
- Use PM2 or similar for process management
- Configure proper CORS origins
- Set up SSL/TLS certificates
- Use CDN for static assets

## Contributing Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/awesome-feature`
3. Make your changes following the code style
4. Test your changes thoroughly
5. Commit with clear messages: `git commit -m "Add awesome feature"`
6. Push to your fork: `git push origin feature/awesome-feature`
7. Create a Pull Request

### Pull Request Guidelines

- Clear description of changes
- Include screenshots for UI changes
- Update documentation if needed
- Ensure tests pass
- Follow code review feedback

## Getting Help

- Check the main [README.md](./README.md) for setup instructions
- Look at existing code for patterns and examples
- Create GitHub issues for bugs or feature requests
- Join discussions for questions and ideas

## Useful Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Building for production
npm run build

# Starting production server
npm start

# View git log with graph
git log --oneline --graph --decorate

# Find your local IP
ifconfig | grep "inet " | grep -v 127.0.0.1
```
