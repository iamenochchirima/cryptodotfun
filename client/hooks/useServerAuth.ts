import { useState, useCallback, useRef } from 'react';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE as USERS_SERVICE, User } from '../declarations/users/users.did';
import { _SERVICE as IDENTITY_CERTIFIER_SERVICE } from '../declarations/identity_certifier/identity_certifier.did';
import { apiInitAuth, apiMe, apiVerifyIdentity, apiLogout } from '@/services/AuthService';
import { SessionData } from '../providers/useSessionData';

// Type definitions for API responses
interface ApiMeResponse {
  success: boolean;
  authenticated: boolean;
  principal?: string;
  sessionCreated?: string;
  sessionExpires?: string;
}

interface ApiInitAuthResponse {
  success: boolean;
  session_id: string;
  expiresAt: string;
  message: string;
}

interface ApiVerifyResponse {
  success: boolean;
  principal?: string;
  message?: string;
  error?: string;
}

interface UseServerAuthProps {
  identityCertifierActor: ActorSubclass<IDENTITY_CERTIFIER_SERVICE> | null;
  usersActor: ActorSubclass<USERS_SERVICE> | null;
  sessionData: SessionData | null;
  updateSessionData: (data: SessionData) => void;
}

interface ServerAuthState {
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  error: string | null;
  user: User | null;
}

export const useServerAuth = ({
  identityCertifierActor,
  usersActor,
  sessionData,
  updateSessionData
}: UseServerAuthProps) => {
  const [state, setState] = useState<ServerAuthState>({
    isAuthenticating: false,
    isAuthenticated: false,
    error: null,
    user: null
  });

  // Prevent multiple concurrent authentication attempts
  const authInProgress = useRef(false);

  const setAuthenticating = (value: boolean) => {
    setState(prev => ({ ...prev, isAuthenticating: value }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setUser = (user: User | null) => {
    setState(prev => ({ 
      ...prev, 
      user, 
      isAuthenticated: !!user,
      error: user ? null : prev.error 
    }));
  };

  // Check if user already has a valid server session
  const checkExistingSession = useCallback(async (): Promise<boolean> => {
    if (!usersActor) return false;

    try {
      const meResponse = await apiMe() as ApiMeResponse;
      if (meResponse?.authenticated && meResponse.principal) {
        // Verify with current session principal
        const currentPrincipal = sessionData?.principalId;
        
        if (meResponse.principal === currentPrincipal) {
          // Get user data
          const userData = await usersActor.get_user();
          if ("Ok" in userData) {
            setUser(userData.Ok);
            

            if (sessionData && !sessionData.isBackendAuthenticated) {
              updateSessionData({
                ...sessionData,
                isBackendAuthenticated: true,
                updatedAt: Date.now(),
              });
            }
            return true;
          }
        } else {
          // Principal mismatch - clear invalid session
          console.warn('Principal mismatch - clearing session');
          await apiLogout();
        }
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
    }
    
    return false;
  }, [usersActor, sessionData, updateSessionData]);

  // Perform server authentication flow
  const authenticateWithServer = useCallback(async (): Promise<boolean> => {
    if (!identityCertifierActor || !usersActor || !sessionData) {
      setError('Required actors or session data not available');
      return false;
    }

    if (authInProgress.current) {
      console.log('Authentication already in progress');
      return false;
    }

    authInProgress.current = true;
    setAuthenticating(true);
    setError(null);

    try {
      // Step 1: Check if already authenticated
      const hasValidSession = await checkExistingSession();
      if (hasValidSession) {
        return true;
      }

      // Step 2: Initialize authentication with server
      console.log('Initiating server authentication...');
      const initResponse = await apiInitAuth() as ApiInitAuthResponse;

      if (!initResponse?.success || !initResponse.session_id) {
        throw new Error('Failed to initialize authentication session');
      }

      console.log('Authentication session created:', initResponse.session_id);

      // Step 3: Confirm identity on IC canister
      console.log('Confirming identity on-chain...');
      const confirmResult = await identityCertifierActor.confirmIdentity(initResponse.session_id);
      
      if (!('Ok' in confirmResult)) {
        const errorType = Object.keys(confirmResult)[0];
        throw new Error(`Identity confirmation failed: ${errorType}`);
      }

      console.log('Identity confirmed, verifying with server...');

      // Step 4: Verify identity with server (with retry)
      let verifyAttempts = 0;
      const maxAttempts = 3;
      let verifySuccess = false;

      while (verifyAttempts < maxAttempts && !verifySuccess) {
        try {
          const verifyResponse = await apiVerifyIdentity(initResponse.session_id) as ApiVerifyResponse;
          
          if (verifyResponse?.success && verifyResponse.principal) {
            console.log('Server verification successful');
            verifySuccess = true;
            break;
          }
        } catch (error) {
          console.error(`Verify attempt ${verifyAttempts + 1} failed:`, error);
        }
        
        verifyAttempts++;
        if (verifyAttempts < maxAttempts) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!verifySuccess) {
        throw new Error('Server verification failed after multiple attempts');
      }

      // Step 5: Get user data and update session
      console.log('Getting user data...');
      const userData = await usersActor.get_user();
      
      if ("Ok" in userData) {
        setUser(userData.Ok);
        
        // Update session data
        updateSessionData({
          ...sessionData,
          isBackendAuthenticated: true,
          updatedAt: Date.now(),
        });
        
        console.log('Server authentication completed successfully');
        return true;
      } else if ("Err" in userData && userData.Err === 'Record not found') {
        // Handle the case where user doesn't exist in the system
        // This is not an error - it just means the user needs to register first
        console.log('User not found in system - authentication successful but user needs to register');
        setError('User not registered. Please complete registration first.');
        
        // Still update session as backend authenticated since the auth flow worked
        updateSessionData({
          ...sessionData,
          isBackendAuthenticated: true,
          updatedAt: Date.now(),
        });
        
        return false; // Don't retry
      } else {
        console.error('Failed to get user data:', userData);
        throw new Error('Failed to retrieve user data');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
      console.error('Server authentication failed:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      authInProgress.current = false;
      setAuthenticating(false);
    }
  }, [identityCertifierActor, usersActor, sessionData, updateSessionData, checkExistingSession]);

  // Reset authentication state
  const resetAuth = useCallback(() => {
    setState({
      isAuthenticating: false,
      isAuthenticated: false,
      error: null,
      user: null
    });
    authInProgress.current = false;
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    ...state,
    authenticateWithServer,
    checkExistingSession,
    resetAuth,
    clearError,
    setUser
  };
};
