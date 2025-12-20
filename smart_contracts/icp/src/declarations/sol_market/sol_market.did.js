export const idlFactory = ({ IDL }) => {
  const InitArgs = IDL.Record({ 'admin' : IDL.Principal });
  const CreateCollectionArgs = IDL.Record({
    'image_url' : IDL.Opt(IDL.Text),
    'metadata' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'name' : IDL.Text,
    'description' : IDL.Opt(IDL.Text),
    'mint_price' : IDL.Nat64,
    'supply' : IDL.Nat64,
    'symbol' : IDL.Text,
    'royalty_bps' : IDL.Nat16,
  });
  const CreateCollectionResponse = IDL.Record({
    'collection_id' : IDL.Text,
    'created_at' : IDL.Nat64,
  });
  const Result = IDL.Variant({
    'Ok' : CreateCollectionResponse,
    'Err' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  const DeploymentStatus = IDL.Variant({
    'Failed' : IDL.Text,
    'Draft' : IDL.Null,
    'AssetsUploaded' : IDL.Null,
    'UploadingAssets' : IDL.Null,
    'Deployed' : IDL.Null,
    'DeployingOnChain' : IDL.Null,
  });
  const SolanaCollection = IDL.Record({
    'id' : IDL.Text,
    'deployment_status' : DeploymentStatus,
    'image_url' : IDL.Opt(IDL.Text),
    'owner' : IDL.Principal,
    'metadata' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'name' : IDL.Text,
    'arweave_base_uri' : IDL.Opt(IDL.Text),
    'description' : IDL.Opt(IDL.Text),
    'created_at' : IDL.Nat64,
    'deployed_at' : IDL.Opt(IDL.Nat64),
    'mint_price' : IDL.Nat64,
    'supply' : IDL.Nat64,
    'solana_address' : IDL.Opt(IDL.Text),
    'symbol' : IDL.Text,
    'royalty_bps' : IDL.Nat16,
  });
  const PaginatedCollections = IDL.Record({
    'collections' : IDL.Vec(SolanaCollection),
    'total_count' : IDL.Nat64,
    'has_more' : IDL.Bool,
  });
  const Result_2 = IDL.Variant({ 'Ok' : SolanaCollection, 'Err' : IDL.Text });
  const SolanaMarketplaceStats = IDL.Record({
    'total_collections' : IDL.Nat64,
    'draft_collections' : IDL.Nat64,
    'failed_collections' : IDL.Nat64,
    'total_creators' : IDL.Nat64,
    'deployed_collections' : IDL.Nat64,
  });
  const CollectionFilter = IDL.Variant({
    'All' : IDL.Null,
    'ByStatus' : DeploymentStatus,
    'Deployed' : IDL.Null,
    'ByOwner' : IDL.Principal,
  });
  const CollectionQueryArgs = IDL.Record({
    'offset' : IDL.Nat64,
    'limit' : IDL.Nat64,
    'filter' : CollectionFilter,
  });
  const UpdateCollectionArgs = IDL.Record({
    'image_url' : IDL.Opt(IDL.Text),
    'metadata' : IDL.Opt(IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))),
    'collection_id' : IDL.Text,
    'description' : IDL.Opt(IDL.Text),
  });
  const UpdateCollectionStatusArgs = IDL.Record({
    'status' : DeploymentStatus,
    'arweave_base_uri' : IDL.Opt(IDL.Text),
    'collection_id' : IDL.Text,
    'solana_address' : IDL.Opt(IDL.Text),
  });
  return IDL.Service({
    'create_collection' : IDL.Func([CreateCollectionArgs], [Result], []),
    'delete_collection' : IDL.Func([IDL.Text], [Result_1], []),
    'get_all_collections' : IDL.Func(
        [IDL.Nat64, IDL.Nat64],
        [PaginatedCollections],
        ['query'],
      ),
    'get_collection_by_id' : IDL.Func([IDL.Text], [Result_2], ['query']),
    'get_marketplace_stats' : IDL.Func([], [SolanaMarketplaceStats], ['query']),
    'get_user_collections' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [IDL.Vec(SolanaCollection)],
        ['query'],
      ),
    'is_name_available' : IDL.Func([IDL.Text], [IDL.Bool], ['query']),
    'query_collections' : IDL.Func(
        [CollectionQueryArgs],
        [PaginatedCollections],
        ['query'],
      ),
    'update_collection' : IDL.Func([UpdateCollectionArgs], [Result_1], []),
    'update_collection_status' : IDL.Func(
        [UpdateCollectionStatusArgs],
        [Result_1],
        [],
      ),
  });
};
export const init = ({ IDL }) => {
  const InitArgs = IDL.Record({ 'admin' : IDL.Principal });
  return [InitArgs];
};
