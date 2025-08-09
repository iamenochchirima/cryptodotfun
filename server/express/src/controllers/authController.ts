import { Request, Response } from 'express';
import { HttpAgent, Actor } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { network } from '../constants';
import crypto from 'crypto';
import { getActor } from '../utils';

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

// Store for active sessions (in production, use Redis or database)
interface SessionData {
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'initiated' | 'confirmed' | 'verified';
}

const activeSessions = new Map<string, SessionData>();

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
    
    // Store session locally
    activeSessions.set(sessionId, {
      sessionId,
      createdAt: new Date(),
      expiresAt,
      status: 'initiated'
    });

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
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Check if session exists locally
    const sessionData = activeSessions.get(sessionId);
    if (!sessionData) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if session expired
    if (new Date() > sessionData.expiresAt) {
      activeSessions.delete(sessionId);
      return res.status(400).json({
        success: false,
        error: 'Session expired'
      });
    }

    const actor = await getActor(network);
    const verifyResult = await actor.verifyIdentity(sessionId) as VerifyIdentityResult;
    const [result, principalOpt] = verifyResult;
    
    if (isAuthResponse(result) && 'Ok' in result) {
      // Update session status
      sessionData.status = 'verified';
      activeSessions.set(sessionId, sessionData);
      
      const principal = principalOpt && principalOpt.length > 0 ? principalOpt[0]?.toString() : null;
      
      res.json({
        success: true,
        sessionId,
        principal,
        message: 'Identity verified successfully',
        // Here you would typically generate a JWT or session token
        // jwt: generateJWT(principal)
      });
    } else {
      const errorType = isAuthResponse(result) ? Object.keys(result)[0] : 'Unknown';
      let message = 'Verification failed';
      
      switch (errorType) {
        case 'NotConfirmed':
          message = 'User has not confirmed their identity yet';
          break;
        case 'Expired':
          message = 'Authentication session expired';
          activeSessions.delete(sessionId);
          break;
        case 'InvalidSession':
          message = 'Invalid session ID';
          activeSessions.delete(sessionId);
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
export const getSessionStatus = (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Session ID is required'
    });
  }

  const sessionData = activeSessions.get(sessionId);
  if (!sessionData) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  const isExpired = new Date() > sessionData.expiresAt;
  
  res.json({
    success: true,
    session: {
      ...sessionData,
      isExpired,
      timeRemaining: isExpired ? 0 : Math.max(0, sessionData.expiresAt.getTime() - Date.now())
    }
  });
};

/**
 * Clean up expired sessions - utility function
 */
export const cleanupExpiredSessions = () => {
  const now = new Date();
  for (const [sessionId, sessionData] of activeSessions.entries()) {
    if (now > sessionData.expiresAt) {
      activeSessions.delete(sessionId);
    }
  }
};

// Clean up expired sessions every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
