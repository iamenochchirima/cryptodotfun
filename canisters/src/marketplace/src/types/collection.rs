use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use ic_stable_structures::Storable;
use ic_stable_structures::storable::Bound;
use std::borrow::Cow;
use super::blockchain::Blockchain;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Collection {
    pub id: String,
    pub blockchain: Blockchain,
    pub creator: Principal,
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub image_url: String,
    pub banner_url: Option<String>,
    pub contract_address: Option<String>,
    pub total_supply: u64,
    pub floor_price: u64,
    pub total_volume: u64,
    pub owner_count: u32,
    pub listed_count: u32,
    pub royalty_bps: u16,
    pub metadata: Vec<(String, String)>,
    pub created_at: u64,
    pub updated_at: u64,
}

impl Storable for Collection {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 2048,
        is_fixed_size: false,
    };
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CreateCollectionArgs {
    pub blockchain: Blockchain,
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub image_url: String,
    pub banner_url: Option<String>,
    pub total_supply: u64,
    pub royalty_bps: u16,
    pub metadata: Vec<(String, String)>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CollectionStats {
    pub floor_price: u64,
    pub total_volume: u64,
    pub owner_count: u32,
    pub listed_count: u32,
}
