use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use ic_stable_structures::Storable;
use ic_stable_structures::storable::Bound;
use std::borrow::Cow;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum OfferStatus {
    Active,
    Accepted,
    Rejected,
    Cancelled,
    Expired,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Offer {
    pub id: String,
    pub listing_id: String,
    pub collection_id: String,
    pub nft_id: String,
    pub bidder: Principal,
    pub price: u64,
    pub currency: String,
    pub status: OfferStatus,
    pub expires_at: u64,
    pub created_at: u64,
    pub updated_at: u64,
}

impl Storable for Offer {
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
pub struct CreateOfferArgs {
    pub listing_id: String,
    pub price: u64,
    pub currency: String,
    pub expires_at: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateOfferArgs {
    pub offer_id: String,
    pub status: OfferStatus,
}
