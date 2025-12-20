export const idlFactory = ({ IDL }) => {
  const IcpInitArgs = IDL.Record({
    'admin' : IDL.Principal,
    'collection_creation_fee' : IDL.Nat,
    'marketplace_fee_percentage' : IDL.Nat16,
  });
  const MarketplaceError = IDL.Variant({
    'InvalidInput' : IDL.Text,
    'TokenNotFound' : IDL.Null,
    'EncodingError' : IDL.Text,
    'InvalidPrice' : IDL.Null,
    'ListingNotActive' : IDL.Null,
    'InvalidCollectionName' : IDL.Null,
    'PaymentFailed' : IDL.Text,
    'CollectionNotFound' : IDL.Null,
    'SystemError' : IDL.Text,
    'InvalidFeePercentage' : IDL.Null,
    'TokenNotOwned' : IDL.Null,
    'CanisterInstallationFailed' : IDL.Text,
    'InvalidDescription' : IDL.Null,
    'InsufficientApproval' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'CanisterCreationFailed' : IDL.Text,
    'CannotBuyOwnListing' : IDL.Null,
    'InvalidDuration' : IDL.Null,
    'ListingExpired' : IDL.Null,
    'TransferFailed' : IDL.Text,
    'CollectionNameAlreadyExists' : IDL.Null,
    'InvalidLogoUrl' : IDL.Null,
    'InvalidCollectionSymbol' : IDL.Null,
    'InsufficientFunds' : IDL.Null,
    'ListingNotFound' : IDL.Null,
    'ListingAlreadyCancelled' : IDL.Null,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : MarketplaceError });
  const BuyNFTArgs = IDL.Record({ 'listing_id' : IDL.Nat64 });
  const IcpCreateCollectionArgs = IDL.Record({
    'supply_cap' : IDL.Opt(IDL.Nat),
    'logo' : IDL.Opt(IDL.Text),
    'description' : IDL.Opt(IDL.Text),
    'collection_name' : IDL.Text,
    'collection_symbol' : IDL.Text,
    'collection_metadata' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
  });
  const IcpCreateCollectionResponse = IDL.Record({
    'transaction_id' : IDL.Nat64,
    'collection_canister_id' : IDL.Principal,
  });
  const Result_1 = IDL.Variant({
    'Ok' : IcpCreateCollectionResponse,
    'Err' : MarketplaceError,
  });
  const DeployCollectionArgs = IDL.Record({
    'supply_cap' : IDL.Nat64,
    'logo' : IDL.Text,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'symbol' : IDL.Text,
  });
  const DeployCollectionResponse = IDL.Record({
    'transaction_id' : IDL.Nat64,
    'owner' : IDL.Principal,
    'collection_id' : IDL.Principal,
    'created_at' : IDL.Nat64,
  });
  const Result_2 = IDL.Variant({
    'Ok' : DeployCollectionResponse,
    'Err' : MarketplaceError,
  });
  const ListingStatus = IDL.Variant({
    'Sold' : IDL.Null,
    'Active' : IDL.Null,
    'Cancelled' : IDL.Null,
    'Expired' : IDL.Null,
  });
  const ListingInfo = IDL.Record({
    'status' : ListingStatus,
    'token_id' : IDL.Nat,
    'collection_id' : IDL.Principal,
    'created_at' : IDL.Nat64,
    'seller' : IDL.Principal,
    'price' : IDL.Nat,
    'expires_at' : IDL.Opt(IDL.Nat64),
  });
  const PaginatedListings = IDL.Record({
    'listings' : IDL.Vec(ListingInfo),
    'total_count' : IDL.Nat64,
    'has_more' : IDL.Bool,
  });
  const CollectionStatus = IDL.Variant({
    'Paused' : IDL.Null,
    'AssetsPending' : IDL.Null,
    'Active' : IDL.Null,
    'Banned' : IDL.Null,
  });
  const CollectionInfo = IDL.Record({
    'id' : IDL.Principal,
    'floor_price' : IDL.Opt(IDL.Nat),
    'status' : CollectionStatus,
    'creator' : IDL.Principal,
    'supply_cap' : IDL.Opt(IDL.Nat),
    'logo' : IDL.Opt(IDL.Text),
    'name' : IDL.Text,
    'description' : IDL.Opt(IDL.Text),
    'created_at' : IDL.Nat64,
    'total_volume' : IDL.Nat,
    'total_supply' : IDL.Nat,
    'symbol' : IDL.Text,
  });
  const IcpPaginatedCollections = IDL.Record({
    'collections' : IDL.Vec(CollectionInfo),
    'total_count' : IDL.Nat64,
    'has_more' : IDL.Bool,
  });
  const Result_3 = IDL.Variant({
    'Ok' : CollectionInfo,
    'Err' : MarketplaceError,
  });
  const Result_4 = IDL.Variant({
    'Ok' : ListingInfo,
    'Err' : MarketplaceError,
  });
  const MarketplaceConfig = IDL.Record({
    'admin' : IDL.Principal,
    'collection_creation_fee' : IDL.Nat,
    'marketplace_fee_percentage' : IDL.Nat16,
    'min_listing_price' : IDL.Nat,
    'supported_tokens' : IDL.Vec(IDL.Principal),
    'max_listing_duration' : IDL.Nat64,
  });
  const IcpMarketplaceStats = IDL.Record({
    'active_collections' : IDL.Nat64,
    'collection_creation_fee' : IDL.Nat,
    'total_collections' : IDL.Nat64,
    'marketplace_fee_percentage' : IDL.Nat16,
    'total_volume' : IDL.Nat,
  });
  const SaleInfo = IDL.Record({
    'transaction_hash' : IDL.Text,
    'token_id' : IDL.Nat,
    'collection_id' : IDL.Principal,
    'sale_time' : IDL.Nat64,
    'seller' : IDL.Principal,
    'buyer' : IDL.Principal,
    'listing_id' : IDL.Nat64,
    'price' : IDL.Nat,
    'marketplace_fee' : IDL.Nat,
  });
  const ListNFTArgs = IDL.Record({
    'duration' : IDL.Opt(IDL.Nat64),
    'token_id' : IDL.Nat,
    'collection_id' : IDL.Principal,
    'price' : IDL.Nat,
  });
  const Result_5 = IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : MarketplaceError });
  return IDL.Service({
    'activate_collection' : IDL.Func([IDL.Principal], [Result], []),
    'buy_nft' : IDL.Func([BuyNFTArgs], [Result], []),
    'cancel_listing' : IDL.Func([IDL.Nat64], [Result], []),
    'create_collection' : IDL.Func([IcpCreateCollectionArgs], [Result_1], []),
    'deploy_collection' : IDL.Func([DeployCollectionArgs], [Result_2], []),
    'get_active_listings' : IDL.Func(
        [IDL.Opt(IDL.Nat64), IDL.Opt(IDL.Nat64)],
        [PaginatedListings],
        ['query'],
      ),
    'get_admin' : IDL.Func([], [IDL.Principal], ['query']),
    'get_all_collections' : IDL.Func(
        [IDL.Opt(IDL.Nat64), IDL.Opt(IDL.Nat64)],
        [IcpPaginatedCollections],
        ['query'],
      ),
    'get_collection_by_name' : IDL.Func([IDL.Text], [Result_3], ['query']),
    'get_collection_info' : IDL.Func([IDL.Principal], [Result_3], ['query']),
    'get_collections_by_creator' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(CollectionInfo)],
        ['query'],
      ),
    'get_listing' : IDL.Func([IDL.Nat64], [Result_4], ['query']),
    'get_listings_by_collection' : IDL.Func(
        [IDL.Principal, IDL.Opt(IDL.Nat64), IDL.Opt(IDL.Nat64)],
        [PaginatedListings],
        ['query'],
      ),
    'get_listings_by_seller' : IDL.Func(
        [IDL.Principal, IDL.Opt(IDL.Nat64), IDL.Opt(IDL.Nat64)],
        [PaginatedListings],
        ['query'],
      ),
    'get_marketplace_config' : IDL.Func([], [MarketplaceConfig], ['query']),
    'get_marketplace_stats' : IDL.Func([], [IcpMarketplaceStats], ['query']),
    'get_sales_history' : IDL.Func(
        [IDL.Opt(IDL.Nat64), IDL.Opt(IDL.Nat64)],
        [IDL.Vec(SaleInfo)],
        ['query'],
      ),
    'get_user_collections' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(CollectionInfo)],
        [],
      ),
    'list_nft' : IDL.Func([ListNFTArgs], [Result_5], []),
    'transfer_admin' : IDL.Func([IDL.Principal], [Result], []),
    'update_collection_creation_fee' : IDL.Func([IDL.Nat], [Result], []),
    'update_collection_status' : IDL.Func(
        [IDL.Principal, CollectionStatus],
        [Result],
        [],
      ),
    'update_marketplace_config' : IDL.Func([MarketplaceConfig], [Result], []),
    'update_marketplace_fee_percentage' : IDL.Func([IDL.Nat16], [Result], []),
  });
};
export const init = ({ IDL }) => {
  const IcpInitArgs = IDL.Record({
    'admin' : IDL.Principal,
    'collection_creation_fee' : IDL.Nat,
    'marketplace_fee_percentage' : IDL.Nat16,
  });
  return [IcpInitArgs];
};
