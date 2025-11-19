use ic_cdk::api::{msg_caller, canister_self};
use ic_cdk::query;
use ic_cdk::println;
use candid::CandidType;
use serde::{Deserialize, Serialize};
use crate::types::*;
use crate::state;
use crate::solana::solana_wallet::SolanaWallet;

#[query]
pub fn get_collection(collection_id: String) -> Option<Collection> {
    state::get_collection(&collection_id)
}

#[query]
pub fn get_all_collections(page: u32, limit: u32) -> Vec<Collection> {
    state::get_all_collections(page, limit)
}

#[query]
pub fn get_collections_by_blockchain(blockchain: Blockchain, page: u32, limit: u32) -> Vec<Collection> {
    state::get_collections_by_blockchain(&blockchain, page, limit)
}

#[query]
pub fn get_listing(collection_id: String, listing_id: String) -> Option<Listing> {
    state::get_listing(&collection_id, &listing_id)
}

#[query]
pub fn get_collection_listings(
    collection_id: String,
    page: u32,
    limit: u32,
    status: Option<ListingStatus>,
) -> Vec<Listing> {
    state::get_collection_listings(&collection_id, page, limit, status)
}

#[query]
pub fn get_user_listings(page: u32, limit: u32) -> Vec<Listing> {
    let caller = msg_caller();
    state::get_user_listings(&caller, page, limit)
}

#[query]
pub fn get_collection_listing_count(collection_id: String) -> u32 {
    state::get_collection_listing_count(&collection_id)
}

#[query]
pub fn get_user_collections(page: u32, limit: u32) -> Vec<Collection> {
    let caller = msg_caller();
    println!("User principal : {}",caller.to_text());
    state::get_user_collections(&caller, page, limit)
}

#[query]
pub fn get_my_draft_collections() -> Vec<Collection> {
    let caller = msg_caller();
    state::get_draft_collections(&caller)
}

#[query]
pub fn get_canister_solana_info() -> Result<CanisterSolanaInfo, String> {
    let canister_id = ic_cdk::id();

    // Get the cached public key from config
    let ed25519_public_key = state::config::get_ed25519_public_key()
        .ok_or("Ed25519 public key not initialized. Call initialize_solana first.")?;

    let pubkey_bytes: [u8; 32] = ed25519_public_key.public_key_bytes
        .try_into()
        .map_err(|_| "Invalid public key bytes")?;

    let main_address = bs58::encode(&pubkey_bytes).into_string();

    Ok(CanisterSolanaInfo {
        canister_id: canister_id.to_text(),
        main_solana_address: main_address,
    })
}

#[query]
pub async fn get_collection_solana_accounts(
    collection_id: String,
) -> Result<CollectionSolanaAccounts, String> {
    if state::get_collection(&collection_id).is_none() {
        return Err("Collection not found".to_string());
    }

    let wallet = SolanaWallet::new(canister_self()).await;
    let payer = wallet.solana_account();
    let candy_machine = wallet.candy_machine_account(&collection_id);

    Ok(CollectionSolanaAccounts {
        collection_id,
        payer_address: payer.to_string(),
        candy_machine_address: candy_machine.to_string(),
    })
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CanisterSolanaInfo {
    pub canister_id: String,
    pub main_solana_address: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CollectionSolanaAccounts {
    pub collection_id: String,
    pub payer_address: String,
    pub candy_machine_address: String,
}
