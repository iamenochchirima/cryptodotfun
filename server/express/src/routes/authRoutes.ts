import express, { Router } from 'express';
import {
  initiateAuthentication,
  verifyIdentity,
  getSessionStatus
} from '../controllers/authController';

const router: Router = express.Router();

/**
 * Authentication Routes for ic-identity-certifier integration
 */

// POST /api/auth/initiate - Start authentication flow
router.post('/initiate', initiateAuthentication);

// GET /api/auth/verify/:sessionId - Verify user identity
router.get('/verify/:sessionId', verifyIdentity);

// GET /api/auth/session/:sessionId - Get session status (utility)
router.get('/session/:sessionId', getSessionStatus);


export default router;
