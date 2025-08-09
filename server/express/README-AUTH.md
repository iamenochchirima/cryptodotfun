# CryptoDotFun Authentication Server

This Express.js server provides authentication endpoints for integrating with the `ic-identity-certifier` canister on the Internet Computer. It enables secure off-chain authentication of ICP principals for hybrid dApps.

## Features

- **Secure Authentication Flow**: Implements the complete authentication workflow with session management
- **IC Integration**: Direct integration with the ic-identity-certifier canister
- **Session Management**: Tracks authentication sessions with automatic cleanup
- **Type Safety**: Full TypeScript implementation with proper error handling

## API Endpoints

### Health & Status
- `GET /health` - Server health check
- `GET /status` - API status information

### Authentication Flow
- `POST /api/auth/initiate` - Start authentication flow (returns sessionId)
- `GET /api/auth/verify/:sessionId` - Verify user identity after confirmation
- `GET /api/auth/session/:sessionId` - Get session status (utility)
- `GET /api/auth/documentation` - Get canister documentation

## Authentication Flow

1. **Frontend**: User connects their wallet
2. **Backend**: Call `POST /api/auth/initiate` to get a sessionId
3. **Frontend**: User calls `confirmIdentity(sessionId)` from their wallet
4. **Backend**: Call `GET /api/auth/verify/:sessionId` to get the user's principal
5. **Backend**: Issue JWT or session token based on verified principal

## Environment Variables

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
IDENTITY_CERTIFIER_CANISTER_ID=your-canister-id-here
IC_NETWORK=local
```

## Installation & Running

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm start
```

## Example Usage

### 1. Initiate Authentication
```bash
curl -X POST http://localhost:3001/api/auth/initiate
```

Response:
```json
{
  "success": true,
  "sessionId": "abc123...",
  "expiresAt": "2025-08-09T12:30:00.000Z",
  "message": "Authentication session initiated. User should call confirmIdentity with this sessionId."
}
```

### 2. User calls confirmIdentity on frontend
```javascript
// Frontend code - user calls this from their wallet
await actor.confirmIdentity(sessionId);
```

### 3. Verify Identity
```bash
curl http://localhost:3001/api/auth/verify/abc123...
```

Response:
```json
{
  "success": true,
  "sessionId": "abc123...",
  "principal": "rdmx6-jaaaa-aaaaa-aaadq-cai",
  "message": "Identity verified successfully"
}
```

## Security Features

- CORS protection with configurable origins
- Helmet for security headers
- Session expiration (5 minutes default)
- Automatic cleanup of expired sessions
- Proper error handling and validation

## Dependencies

- **Express.js** - Web framework
- **@dfinity/agent** - IC integration
- **TypeScript** - Type safety
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers
- **Morgan** - HTTP logging
