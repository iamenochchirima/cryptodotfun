use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use ic_stable_structures::Storable;
use ic_stable_structures::storable::Bound;
use std::borrow::Cow;

#[derive(CandidType, Clone, Serialize, Deserialize, Debug, PartialEq, Eq, Hash)]
pub struct Interest {
    value: String,
}

impl Interest {
    const VALID_INTERESTS: &'static [&'static str] = &[
        "NFTS",
        "TOKENS",
        "BTC_ASSETS",
        "LEARNING",
        "GAMING",
        "EARNING",
        "SECURITY",
        "COMMUNITY",
    ];

    pub fn new(value: &str) -> Result<Self, String> {
        if Self::VALID_INTERESTS.contains(&value) {
            Ok(Interest { value: value.to_string() })
        } else {
            Err(format!("Invalid interest: {}", value))
        }
    }

    pub fn nfts() -> Self {
        Interest { value: "NFTS".to_string() }
    }
    pub fn btc_assets() -> Self {
        Interest { value: "BTC_ASSETS".to_string() }
    }
    pub fn tokens() -> Self {
        Interest { value: "TOKENS".to_string() }
    }
    pub fn learning() -> Self {
        Interest { value: "LEARNING".to_string() }
    }
    pub fn gaming() -> Self {
        Interest { value: "GAMING".to_string() }
    }
    pub fn earning() -> Self {
        Interest { value: "EARNING".to_string() }
    }
    pub fn security() -> Self {
        Interest { value: "SECURITY".to_string() }
    }
    pub fn community() -> Self {
        Interest { value: "COMMUNITY".to_string() }
    }

    pub fn as_str(&self) -> &str {
        &self.value
    }
    pub fn valid_options() -> &'static [&'static str] {
        Self::VALID_INTERESTS
    }
}

#[derive(CandidType, Clone, Serialize, Deserialize)]
pub enum Chain {
    Bitcoin,
    Ethereum,
    Solana,
    ICP,
    Other(String),
}

#[derive(CandidType, Clone, Serialize, Deserialize)]
pub struct ChainData {
    pub chain: Chain,
    pub wallet: String,
    pub wallet_address: String,
}

#[derive(CandidType, Clone, Serialize, Deserialize)]
pub struct User {
    pub principal: Principal,
    pub username: String,
    pub chain_data: ChainData,
    pub image_url: Option<String>,
    pub email: Option<String>,
    pub referral_source: Option<String>,
    pub referral_code: Option<String>,
    pub interests: Vec<Interest>,
    pub created_at: u64,
}

impl Storable for User {
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
        max_size: 2048,
        is_fixed_size: false,
    };
}

#[derive(CandidType, Clone, Serialize, Deserialize)]
pub struct AddUserArgs {
    pub username: String,
    pub chain_data: ChainData,
    pub image_url: Option<String>,
    pub email: Option<String>,
    pub referral_source: Option<String>,
    pub referral_code: Option<String>,
    pub interests: Vec<String>,
}
