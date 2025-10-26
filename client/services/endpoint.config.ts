

export const apiPrefix = "/api";

const endpointConfig = {
  initAuth: "/auth/initiate",
  verifyIdentity: "/auth/verify",
  logout: "/auth/logout",
  me: "/auth/status",
  drafts: "/drafts",
  userDrafts: (userId: string) => `/drafts/user/${userId}`,
  draft: (draftId: string) => `/drafts/${draftId}`,
  uploadDraftImage: "/uploads/draft-image",
  batchUploadNftAssets: "/uploads/batch-nft-assets",
};

export default endpointConfig;
