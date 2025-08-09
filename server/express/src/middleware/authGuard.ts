import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../../index';

interface UserSession {
  sessionId: string;
  principal: string;
  createdAt: Date;
  expiresAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        principal: string;
        sessionId: string;
        sessionCreated: Date;
        sessionExpires: Date;
      };
    }
  }
}

export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.cookies?.CRYPTO_DOT_FUN_SESSION;
    
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required - no session cookie found'
      });
    }

    const userSessionStr = await redisClient.get(`user_session:${sessionId}`);
    if (!userSessionStr) {
      res.clearCookie('CRYPTO_DOT_FUN_SESSION');
      return res.status(401).json({
        success: false,
        error: 'Authentication required - session not found or expired'
      });
    }

    const userSession: UserSession = JSON.parse(userSessionStr);
    
    // Check if session expired
    if (new Date() > new Date(userSession.expiresAt)) {
      await redisClient.del(`user_session:${sessionId}`);
      res.clearCookie('CRYPTO_DOT_FUN_SESSION');
      return res.status(401).json({
        success: false,
        error: 'Authentication required - session expired'
      });
    }

    // Attach user info to request object
    req.user = {
      principal: userSession.principal,
      sessionId: userSession.sessionId,
      sessionCreated: new Date(userSession.createdAt),
      sessionExpires: new Date(userSession.expiresAt)
    };

    next();
  } catch (error) {
    console.error('Auth guard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication check'
    });
  }
};