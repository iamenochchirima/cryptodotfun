use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use ic_stable_structures::Storable;
use ic_stable_structures::storable::Bound;
use std::borrow::Cow;
use super::blockchain::Blockchain;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Sale {
    pub id: String,
    pub listing_id: String,
    pub collection_id: String,
    pub nft_id: String,
    pub blockchain: Blockchain,
    pub seller: Principal,
    pub buyer: Principal,
    pub price: u64,
    pub currency: String,
    pub tx_signature: String,
    pub sold_at: u64,
}

impl Storable for Sale {
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
        max_size: 512,
        is_fixed_size: false,
    };
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct RecordSaleArgs {
    pub listing_id: String,
    pub buyer: Principal,
    pub tx_signature: String,
}
