use candid::{Nat, Principal};
use ic_cdk_macros::init;

pub mod constants;
pub mod types;
pub mod state;
pub mod errors;
pub mod utils;
pub mod updates;
pub mod queries;

use crate::types::{
    InitArgs, CreateCollectionArgs, CreateCollectionResponse,
    CollectionInfo, PaginatedCollections, MarketplaceStats,
    ListNFTArgs, BuyNFTArgs, ListingInfo, PaginatedListings,
    SaleInfo, MarketplaceConfig, DeployCollectionArgs, DeployCollectionResponse, CollectionStatus
};
use crate::errors::MarketplaceError;

#[init]
fn init(args: InitArgs) {
    state::init_marketplace(args.admin, args.collection_creation_fee, args.marketplace_fee_percentage);
}

ic_cdk::export_candid!();