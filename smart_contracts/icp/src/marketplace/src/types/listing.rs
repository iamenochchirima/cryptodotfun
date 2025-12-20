use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use ic_stable_structures::Storable;
use ic_stable_structures::storable::Bound;
use std::borrow::Cow;
use super::blockchain::Blockchain;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum ListingStatus {
    Active,
    Sold,
    Cancelled,
    Expired,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Listing {
    pub id: String,
    pub collection_id: String,
    pub nft_id: String,
    pub blockchain: Blockchain,
    pub seller: Principal,
    pub seller_address: String,
    pub price: u64,
    pub currency: String,
    pub escrow_address: Option<String>,
    pub status: ListingStatus,
    pub listed_at: u64,
    pub expires_at: Option<u64>,
    pub updated_at: u64,
    pub nft_metadata: NftMetadata,
}

impl Storable for Listing {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(&self).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 1024,
        is_fixed_size: false,
    };
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct NftMetadata {
    pub name: String,
    pub image_url: String,
    pub attributes: Vec<NftAttribute>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct NftAttribute {
    pub trait_type: String,
    pub value: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CreateListingArgs {
    pub collection_id: String,
    pub nft_id: String,
    pub seller_address: String,
    pub price: u64,
    pub currency: String,
    pub expires_at: Option<u64>,
    pub nft_metadata: NftMetadata,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateListingArgs {
    pub listing_id: String,
    pub price: Option<u64>,
    pub status: Option<ListingStatus>,
}
