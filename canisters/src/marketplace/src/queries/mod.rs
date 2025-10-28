use ic_cdk_macros::query;
use crate::types::*;
use crate::state;

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
    let caller = ic_cdk::caller();
    state::get_user_listings(&caller, page, limit)
}

#[query]
pub fn get_collection_listing_count(collection_id: String) -> u32 {
    state::get_collection_listing_count(&collection_id)
}
