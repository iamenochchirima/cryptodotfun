export enum DraftStatus {
  Draft = "draft",
  Uploading = "uploading",
  Deployed = "deployed",
}

export interface CollectionDraft {
  id: string;
  user_id: string;
  blockchain: string;
  nft_standard?: string;
  name: string;
  symbol: string;
  description?: string;
  supply: number;
  mint_price: string;
  royalty_bps: number;
  collection_image_url?: string;
  metadata: Record<string, any>;
  status: DraftStatus;
  created_at: string;
  updated_at: string;
  canister_record_id?: string; 
}

export interface CreateDraftRequest {
  user_id: string;
  blockchain: string;
  nft_standard?: string;
  name: string;
  symbol: string;
  description?: string;
  supply: number;
  mint_price: string;
  royalty_bps: number;
  collection_image_url?: string;
  metadata?: Record<string, any>;
}

export interface UpdateDraftRequest {
  name?: string;
  symbol?: string;
  description?: string;
  supply?: number;
  mint_price?: string;
  royalty_bps?: number;
  collection_image_url?: string;
  metadata?: Record<string, any>;
  status?: DraftStatus;
  canister_record_id?: string; 
}
