import { Request, Response } from 'express';
import { HttpAgent, Actor } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { network } from '../constants';
import crypto from 'crypto';
import { getActor } from '../utils';
import { redisClient } from '../../index';

// Types based on the canister interface
type AuthResponse = {
  Ok: null;
} | {
  Unauthorized: null;
} | {
  Expired: null;
} | {
  NotConfirmed: null;
} | {
  InvalidSession: null;
};

type VerifyIdentityResult = [AuthResponse, Principal[]];

// Type guards for response handling
const isAuthResponse = (obj: any): obj is AuthResponse => {
  return obj && (
    'Ok' in obj || 
    'Unauthorized' in obj || 
    'Expired' in obj || 
    'NotConfirmed' in obj || 
    'InvalidSession' in obj
  );
};

interface SessionData {
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'initiated' | 'confirmed' | 'verified';
  principal?: string;
}

interface UserSession {
  sessionId: string;
  principal: string;
  createdAt: Date;
  expiresAt: Date;
}

// Generate secure session ID
const generateSessionId = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Step 1: Generate session ID and initiate authentication
 * Frontend calls this to start the auth flow
 */

export type InitAuthResponse = {
  success: boolean;
  sessionId: string;
  expiresAt: string;
  message: string;
};

export const initiateAuthentication = async (req: Request, res: Response) => {
  try {
    const sessionId = generateSessionId();
    const expirationMinutes = 5; // Default 5 minutes
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
    
    // Store session in Redis
    const sessionData: SessionData = {
      sessionId,
      createdAt: new Date(),
      expiresAt,
      status: 'initiated'
    };
    
    await redisClient.setex(
      `auth_session:${sessionId}`, 
      expirationMinutes * 60, 
      JSON.stringify(sessionData)
    );

    const actor = await getActor(network);
    const expirationNanoseconds = BigInt(expirationMinutes * 60 * 1000 * 1000 * 1000); // Convert to nanoseconds
    
    const result = await actor.initiateAuth(sessionId, [expirationNanoseconds]) as AuthResponse;
    
    if (isAuthResponse(result) && 'Ok' in result) {
      res.json({
        success: true,
        sessionId,
        expiresAt: expiresAt.toISOString(),
        message: 'Authentication session initiated. User should call confirmIdentity with this sessionId.'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to initiate authentication',
        details: isAuthResponse(result) ? Object.keys(result)[0] : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error initiating authentication:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Step 2: Verify user identity after they called confirmIdentity
 * Backend calls this to check if user confirmed their identity
 */
export const verifyIdentity = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Get session from Redis
    const sessionDataStr = await redisClient.get(`auth_session:${sessionId}`);
    if (!sessionDataStr) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const sessionData: SessionData = JSON.parse(sessionDataStr);
    
    // Check if session expired
    if (new Date() > new Date(sessionData.expiresAt)) {
      await redisClient.del(`auth_session:${sessionId}`);
      return res.status(400).json({
        success: false,
        error: 'Session expired'
      });
    }

    const actor = await getActor(network);
    console.log(`Verifying identity for sessionId: ${sessionId} using actor:`, actor);
    const verifyResult = await actor.verifyIdentity(sessionId) as VerifyIdentityResult;
    console.log(`Verify result for sessionId ${sessionId}:`, verifyResult);
    const [result, principalOpt] = verifyResult;
    
    if (isAuthResponse(result) && 'Ok' in result) {
      const principal = principalOpt && principalOpt.length > 0 ? principalOpt[0]?.toString() : null;
      
      if (principal) {
        // Create a new user session with longer expiration (7 days)
        const userSessionId = generateSessionId();
        const userSessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        
        const userSession: UserSession = {
          sessionId: userSessionId,
          principal,
          createdAt: new Date(),
          expiresAt: userSessionExpiry
        };
        
        // Store user session in Redis (expires in 7 days)
        await redisClient.setex(
          `user_session:${userSessionId}`,
          7 * 24 * 60 * 60,
          JSON.stringify(userSession)
        );
        
        // Create HTTP-only cookie
        res.cookie('CRYPTO_DOT_FUN_SESSION', userSessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/'
        });
        
        // Clean up auth session
        await redisClient.del(`auth_session:${sessionId}`);
        
        res.json({
          success: true,
          principal,
          message: 'Identity verified successfully and session created'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'No principal returned from verification'
        });
      }
    } else {
      const errorType = isAuthResponse(result) ? Object.keys(result)[0] : 'Unknown';
      let message = 'Verification failed';
      
      switch (errorType) {
        case 'NotConfirmed':
          message = 'User has not confirmed their identity yet';
          break;
        case 'Expired':
          message = 'Authentication session expired';
          await redisClient.del(`auth_session:${sessionId}`);
          break;
        case 'InvalidSession':
          message = 'Invalid session ID';
          await redisClient.del(`auth_session:${sessionId}`);
          break;
        case 'Unauthorized':
          message = 'Unauthorized to verify this session';
          break;
      }
      
      res.status(400).json({
        success: false,
        error: message,
        details: errorType
      });
    }
  } catch (error) {
    console.error('Error verifying identity:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get session status - utility endpoint for debugging
 */
export const getSessionStatus = async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Session ID is required'
    });
  }

  try {
    const sessionDataStr = await redisClient.get(`auth_session:${sessionId}`);
    if (!sessionDataStr) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const sessionData: SessionData = JSON.parse(sessionDataStr);
    const isExpired = new Date() > new Date(sessionData.expiresAt);
    
    res.json({
      success: true,
      session: {
        ...sessionData,
        isExpired,
        timeRemaining: isExpired ? 0 : Math.max(0, new Date(sessionData.expiresAt).getTime() - Date.now())
      }
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Check if user is authenticated - /auth/me endpoint
 */
export const checkAuth = async (req: Request, res: Response) => {
  try {
    const sessionId = req.cookies?.CRYPTO_DOT_FUN_SESSION;
    
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'No session cookie found'
      });
    }

    const userSessionStr = await redisClient.get(`user_session:${sessionId}`);
    if (!userSessionStr) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Session not found or expired'
      });
    }

    const userSession: UserSession = JSON.parse(userSessionStr);
    
    // Check if session expired
    if (new Date() > new Date(userSession.expiresAt)) {
      await redisClient.del(`user_session:${sessionId}`);
      res.clearCookie('CRYPTO_DOT_FUN_SESSION');
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Session expired'
      });
    }

    res.json({
      success: true,
      authenticated: true,
      principal: userSession.principal,
      sessionCreated: userSession.createdAt,
      sessionExpires: userSession.expiresAt
    });
  } catch (error) {
    console.error('Error checking authentication:', error);
    res.status(500).json({
      success: false,
      authenticated: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Logout user - clear session and remove cookie
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const sessionId = req.cookies?.CRYPTO_DOT_FUN_SESSION;
    
    if (sessionId) {
      // Remove session from Redis
      await redisClient.del(`user_session:${sessionId}`);
    }
    
    // Clear the session cookie
    res.clearCookie('CRYPTO_DOT_FUN_SESSION', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during logout'
    });
  }
};

/**
 * Clean up expired sessions - Redis handles TTL automatically
 * This is just for manual cleanup if needed
 */
export const cleanupExpiredSessions = async () => {
  try {
    const authSessionKeys = await redisClient.keys('auth_session:*');
    const userSessionKeys = await redisClient.keys('user_session:*');
    
    const now = new Date();
    
    for (const key of [...authSessionKeys, ...userSessionKeys]) {
      const sessionStr = await redisClient.get(key);
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (new Date(session.expiresAt) < now) {
          await redisClient.del(key);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
};
