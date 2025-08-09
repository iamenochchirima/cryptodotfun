export type InitAuthResponse = {
  success: boolean;
  sessionId: string;
  expiresAt: string;
  message: string;
};