use candid::{CandidType, Principal, Nat};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct InitArgs {
    pub collection_creation_fee: Nat,
    pub marketplace_fee_percentage: u16, // Basis points (e.g., 250 = 2.5%)
    pub admin: Principal,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CreateCollectionArgs {
    pub collection_name: String,
    pub collection_symbol: String,
    pub description: Option<String>,
    pub logo: Option<String>,
    pub supply_cap: Option<Nat>,
    pub collection_metadata: Vec<(String, String)>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct DeployCollectionArgs {
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub logo: String,
    pub supply_cap: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct DeployCollectionResponse {
    pub collection_id: Principal,
    pub owner: Principal,
    pub created_at: u64,
    pub transaction_id: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CreateCollectionResponse {
    pub collection_canister_id: Principal,
    pub transaction_id: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CollectionInfo {
    pub id: Principal,
    pub creator: Principal,
    pub name: String,
    pub symbol: String,
    pub description: Option<String>,
    pub logo: Option<String>,
    pub supply_cap: Option<Nat>,
    pub created_at: u64,
    pub status: CollectionStatus,
    pub total_supply: Nat,
    pub floor_price: Option<Nat>,
    pub total_volume: Nat,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum CollectionStatus {
    AssetsPending,
    Active,
    Paused,
    Banned,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PaginatedCollections {
    pub collections: Vec<CollectionInfo>,
    pub total_count: u64,
    pub has_more: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct MarketplaceStats {
    pub total_collections: u64,
    pub total_volume: Nat,
    pub collection_creation_fee: Nat,
    pub marketplace_fee_percentage: u16,
    pub active_collections: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ListingInfo {
    pub token_id: Nat,
    pub collection_id: Principal,
    pub seller: Principal,
    pub price: Nat,
    pub created_at: u64,
    pub expires_at: Option<u64>,
    pub status: ListingStatus,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum ListingStatus {
    Active,
    Sold,
    Cancelled,
    Expired,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SaleInfo {
    pub listing_id: u64,
    pub token_id: Nat,
    pub collection_id: Principal,
    pub seller: Principal,
    pub buyer: Principal,
    pub price: Nat,
    pub marketplace_fee: Nat,
    pub sale_time: u64,
    pub transaction_hash: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ListNFTArgs {
    pub collection_id: Principal,
    pub token_id: Nat,
    pub price: Nat,
    pub duration: Option<u64>, // Duration in nanoseconds
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct BuyNFTArgs {
    pub listing_id: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PaginatedListings {
    pub listings: Vec<ListingInfo>,
    pub total_count: u64,
    pub has_more: bool,
}

// Marketplace configuration types
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct MarketplaceConfig {
    pub collection_creation_fee: Nat,
    pub marketplace_fee_percentage: u16,
    pub max_listing_duration: u64,
    pub min_listing_price: Nat,
    pub supported_tokens: Vec<Principal>, // Supported payment tokens
    pub admin: Principal,
}

// Event types for logging
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum MarketplaceEvent {
    CollectionCreated {
        collection_id: Principal,
        creator: Principal,
        name: String,
        timestamp: u64,
    },
    CollectionActivated {
        collection_id: Principal,
        creator: Principal,
        timestamp: u64,
    },
    ItemListed {
        listing_id: u64,
        collection_id: Principal,
        token_id: Nat,
        seller: Principal,
        price: Nat,
        timestamp: u64,
    },
    ItemSold {
        listing_id: u64,
        collection_id: Principal,
        token_id: Nat,
        seller: Principal,
        buyer: Principal,
        price: Nat,
        timestamp: u64,
    },
    ListingCancelled {
        listing_id: u64,
        collection_id: Principal,
        token_id: Nat,
        seller: Principal,
        timestamp: u64,
    },
}