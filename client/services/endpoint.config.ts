

export const apiPrefix = "/api";

const endpointConfig = {
  initAuth: "/auth/initiate",
  verifyIdentity: "/auth/verify", 
  logout: "/auth/logout",
  me: "/auth/status", // Changed from /auth/me to /auth/status to match Rust server
};

export default endpointConfig;
