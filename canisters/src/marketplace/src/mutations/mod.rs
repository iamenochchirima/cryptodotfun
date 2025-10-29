use ic_cdk_macros::update;
use crate::types::*;
use crate::state;

#[update]
pub fn create_collection(args: CreateCollectionArgs) -> Result<String, String> {
    let caller = ic_cdk::caller();
    state::add_collection(args, caller)
}

#[update]
pub fn create_listing(args: CreateListingArgs, blockchain: Blockchain) -> Result<String, String> {
    let caller = ic_cdk::caller();
    state::add_listing(args, caller, blockchain)
}

#[update]
pub fn update_listing(args: UpdateListingArgs, collection_id: String) -> Result<(), String> {
    state::update_listing(args, &collection_id)
}

#[update]
pub fn cancel_listing(collection_id: String, listing_id: String) -> Result<(), String> {
    let caller = ic_cdk::caller();

    if let Some(listing) = state::get_listing(&collection_id, &listing_id) {
        if listing.seller != caller {
            return Err("Not authorized".to_string());
        }

        state::update_listing(
            UpdateListingArgs {
                listing_id: listing_id.clone(),
                price: None,
                status: Some(ListingStatus::Cancelled),
            },
            &collection_id,
        )
    } else {
        Err("Listing not found".to_string())
    }
}

#[update]
pub fn update_collection_status(args: UpdateCollectionStatusArgs) -> Result<(), String> {
    let caller = ic_cdk::caller();

    if let Some(collection) = state::get_collection(&args.collection_id) {
        if collection.creator != caller {
            return Err("Not authorized".to_string());
        }
        state::update_collection_status(args)
    } else {
        Err("Collection not found".to_string())
    }
}

#[update]
pub fn update_solana_stage(args: UpdateSolanaStageArgs) -> Result<(), String> {
    let caller = ic_cdk::caller();

    if let Some(collection) = state::get_collection(&args.collection_id) {
        if collection.creator != caller {
            return Err("Not authorized".to_string());
        }
        state::update_solana_stage(args)
    } else {
        Err("Collection not found".to_string())
    }
}
