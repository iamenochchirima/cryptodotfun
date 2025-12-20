import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type CollectionFilter = { 'All' : null } |
  { 'ByStatus' : DeploymentStatus } |
  { 'Deployed' : null } |
  { 'ByOwner' : Principal };
export interface CollectionQueryArgs {
  'offset' : bigint,
  'limit' : bigint,
  'filter' : CollectionFilter,
}
export interface CreateCollectionArgs {
  'image_url' : [] | [string],
  'metadata' : Array<[string, string]>,
  'name' : string,
  'description' : [] | [string],
  'mint_price' : bigint,
  'supply' : bigint,
  'symbol' : string,
  'royalty_bps' : number,
}
export interface CreateCollectionResponse {
  'collection_id' : string,
  'created_at' : bigint,
}
export type DeploymentStatus = { 'Failed' : string } |
  { 'Draft' : null } |
  { 'AssetsUploaded' : null } |
  { 'UploadingAssets' : null } |
  { 'Deployed' : null } |
  { 'DeployingOnChain' : null };
export interface InitArgs { 'admin' : Principal }
export interface PaginatedCollections {
  'collections' : Array<SolanaCollection>,
  'total_count' : bigint,
  'has_more' : boolean,
}
export type Result = { 'Ok' : CreateCollectionResponse } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : null } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : SolanaCollection } |
  { 'Err' : string };
export interface SolanaCollection {
  'id' : string,
  'deployment_status' : DeploymentStatus,
  'image_url' : [] | [string],
  'owner' : Principal,
  'metadata' : Array<[string, string]>,
  'name' : string,
  'arweave_base_uri' : [] | [string],
  'description' : [] | [string],
  'created_at' : bigint,
  'deployed_at' : [] | [bigint],
  'mint_price' : bigint,
  'supply' : bigint,
  'solana_address' : [] | [string],
  'symbol' : string,
  'royalty_bps' : number,
}
export interface SolanaMarketplaceStats {
  'total_collections' : bigint,
  'draft_collections' : bigint,
  'failed_collections' : bigint,
  'total_creators' : bigint,
  'deployed_collections' : bigint,
}
export interface UpdateCollectionArgs {
  'image_url' : [] | [string],
  'metadata' : [] | [Array<[string, string]>],
  'collection_id' : string,
  'description' : [] | [string],
}
export interface UpdateCollectionStatusArgs {
  'status' : DeploymentStatus,
  'arweave_base_uri' : [] | [string],
  'collection_id' : string,
  'solana_address' : [] | [string],
}
export interface _SERVICE {
  'create_collection' : ActorMethod<[CreateCollectionArgs], Result>,
  /**
   * Delete a collection (only if in Draft status)
   */
  'delete_collection' : ActorMethod<[string], Result_1>,
  /**
   * Get all collections with simple pagination
   */
  'get_all_collections' : ActorMethod<[bigint, bigint], PaginatedCollections>,
  'get_collection_by_id' : ActorMethod<[string], Result_2>,
  /**
   * Get marketplace statistics
   */
  'get_marketplace_stats' : ActorMethod<[], SolanaMarketplaceStats>,
  'get_user_collections' : ActorMethod<
    [[] | [Principal]],
    Array<SolanaCollection>
  >,
  /**
   * Check if a collection name is available
   */
  'is_name_available' : ActorMethod<[string], boolean>,
  'query_collections' : ActorMethod<
    [CollectionQueryArgs],
    PaginatedCollections
  >,
  /**
   * Update collection metadata (only for Draft status)
   */
  'update_collection' : ActorMethod<[UpdateCollectionArgs], Result_1>,
  'update_collection_status' : ActorMethod<
    [UpdateCollectionStatusArgs],
    Result_1
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
