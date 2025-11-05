use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use ic_stable_structures::Storable;
use ic_stable_structures::storable::Bound;
use std::borrow::Cow;
use super::blockchain::Blockchain;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum CollectionStatus {
    Draft,
    Active,
    Paused,
    Minting,
    Completed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ChainData {
    Solana(SolanaCollectionData),
    ICP(ICPCollectionData),
    Ethereum(EthereumCollectionData),
    Bitcoin(BitcoinCollectionData),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SolanaCollectionData {
    pub deployment_stage: SolanaDeploymentStage,
    pub candy_machine_address: Option<String>,
    pub collection_mint: Option<String>,
    pub manifest_url: Option<String>,
    pub files_uploaded: bool,
    pub metadata_created: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum SolanaDeploymentStage {
    FilesUploading,
    FilesUploaded,
    MetadataCreating,
    MetadataCreated,
    CandyMachineDeploying,
    Deployed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ICPCollectionData {
    pub deployment_stage: ICPDeploymentStage,
    pub canister_id: Option<Principal>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum ICPDeploymentStage {
    CanisterCreating,
    CanisterDeploying,
    Deployed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct EthereumCollectionData {
    pub deployment_stage: EthereumDeploymentStage,
    pub contract_address: Option<String>,
    pub chain_id: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum EthereumDeploymentStage {
    ContractDeploying,
    Deployed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct BitcoinCollectionData {
    pub deployment_stage: BitcoinDeploymentStage,
    pub inscription_ids: Vec<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum BitcoinDeploymentStage {
    InscriptionsCreating,
    Deployed,
}

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
    pub total_supply: u64,
    pub floor_price: u64,
    pub total_volume: u64,
    pub owner_count: u32,
    pub listed_count: u32,
    pub royalty_bps: u16,
    pub metadata: Vec<(String, String)>,
    pub status: CollectionStatus,
    pub chain_data: ChainData,
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

    fn into_bytes(self) -> Vec<u8> {
        candid::encode_one(&self).unwrap()
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
    pub chain_data: ChainData,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CollectionStats {
    pub floor_price: u64,
    pub total_volume: u64,
    pub owner_count: u32,
    pub listed_count: u32,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateCollectionStatusArgs {
    pub collection_id: String,
    pub status: CollectionStatus,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateSolanaStageArgs {
    pub collection_id: String,
    pub stage: SolanaDeploymentStage,
    pub candy_machine_address: Option<String>,
    pub collection_mint: Option<String>,
    pub manifest_url: Option<String>,
    pub files_uploaded: Option<bool>,
    pub metadata_created: Option<bool>,
}
