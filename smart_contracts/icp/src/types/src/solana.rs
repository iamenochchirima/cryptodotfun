use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use ic_stable_structures::Storable;
use ic_stable_structures::storable::Bound;
use std::borrow::Cow;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SolanaCollection {
    pub id: String,
    pub owner: Principal,
    pub name: String,
    pub symbol: String,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub arweave_base_uri: Option<String>,
    pub solana_address: Option<String>,
    pub supply: u64,
    pub mint_price: u64,
    pub royalty_bps: u16,
    pub deployment_status: DeploymentStatus,
    pub created_at: u64,
    pub deployed_at: Option<u64>,
    pub metadata: Vec<(String, String)>,
}

impl Storable for SolanaCollection {
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

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum DeploymentStatus {
    Draft,
    UploadingAssets,
    AssetsUploaded,
    DeployingOnChain,
    Deployed,
    Failed(String),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CreateCollectionArgs {
    pub name: String,
    pub symbol: String,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub supply: u64,
    pub mint_price: u64,
    pub royalty_bps: u16,
    pub metadata: Vec<(String, String)>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateCollectionStatusArgs {
    pub collection_id: String,
    pub status: DeploymentStatus,
    pub arweave_base_uri: Option<String>,
    pub solana_address: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateCollectionArgs {
    pub collection_id: String,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub metadata: Option<Vec<(String, String)>>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CreateCollectionResponse {
    pub collection_id: String,
    pub created_at: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PaginatedCollections {
    pub collections: Vec<SolanaCollection>,
    pub total_count: u64,
    pub has_more: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SolanaMarketplaceStats {
    pub total_collections: u64,
    pub deployed_collections: u64,
    pub draft_collections: u64,
    pub failed_collections: u64,
    pub total_creators: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum CollectionFilter {
    All,
    ByStatus(DeploymentStatus),
    ByOwner(Principal),
    Deployed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CollectionQueryArgs {
    pub filter: CollectionFilter,
    pub offset: u64,
    pub limit: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct InitArgs {
    pub admin: Principal,
}
